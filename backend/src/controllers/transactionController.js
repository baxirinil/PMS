import pool from '../config/db.js';

// Add Transaction (BUY, SELL, SPLIT, BONUS, DIVIDEND, BUYBACK, DEMERGER)
export const addTransaction = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      portfolio_id,
      instrument_id,
      type,
      quantity,
      price_per_share = 0,
      brokerage = 0,
      stt = 0,
      other_charges = 0,
      transaction_date,
      notes,
      // Corporate Action Details (Optional depending on type)
      ratio_old,
      ratio_new,
      demerger_cost_ratio,
      resulting_instrument_id
    } = req.body;

    await client.query('BEGIN');

    // 1. Insert Master Transaction Record
    const txResult = await client.query(
      `INSERT INTO transactions 
        (portfolio_id, instrument_id, type, quantity, price_per_share, brokerage, stt, other_charges, transaction_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [portfolio_id, instrument_id, type, quantity, price_per_share, brokerage, stt, other_charges, transaction_date, notes]
    );

    const transaction = txResult.rows[0];

    // 2. Handle Business Logic & FIFO Ledger Updates
    if (type === 'BUY') {
      // Calculate net cost per share including taxes
      const totalCost = (Number(quantity) * Number(price_per_share)) + Number(brokerage) + Number(stt) + Number(other_charges);
      const effectiveCostPerShare = totalCost / Number(quantity);

      await client.query(
        `INSERT INTO holdings_fifo (portfolio_id, instrument_id, buy_transaction_id, buy_date, remaining_quantity, cost_per_share)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [portfolio_id, instrument_id, transaction.transaction_id, transaction_date, quantity, effectiveCostPerShare]
      );
    } 
    
    else if (type === 'SELL' || type === 'BUYBACK') {
      // FIFO Depletion Engine
      let qtyToSell = Number(quantity);

      const fifoLots = await client.query(
        `SELECT * FROM holdings_fifo 
         WHERE portfolio_id = $1 AND instrument_id = $2 AND remaining_quantity > 0 
         ORDER BY buy_date ASC, created_at ASC FOR UPDATE`,
        [portfolio_id, instrument_id]
      );

      let totalAvailable = fifoLots.rows.reduce((acc, lot) => acc + Number(lot.remaining_quantity), 0);
      if (totalAvailable < qtyToSell) {
        throw new Error(`Insufficient holding balance. Available: ${totalAvailable}, Requested: ${qtyToSell}`);
      }

      for (const lot of fifoLots.rows) {
        if (qtyToSell <= 0) break;

        const lotQty = Number(lot.remaining_quantity);
        if (lotQty <= qtyToSell) {
          qtyToSell -= lotQty;
          await client.query(`UPDATE holdings_fifo SET remaining_quantity = 0 WHERE holding_id = $1`, [lot.holding_id]);
        } else {
          const newQty = lotQty - qtyToSell;
          qtyToSell = 0;
          await client.query(`UPDATE holdings_fifo SET remaining_quantity = $1 WHERE holding_id = $2`, [newQty, lot.holding_id]);
        }
      }
    } 
    
    else if (type === 'BONUS') {
      // Bonus shares added at zero cost basis (averages down holding price)
      await client.query(
        `INSERT INTO holdings_fifo (portfolio_id, instrument_id, buy_transaction_id, buy_date, remaining_quantity, cost_per_share)
         VALUES ($1, $2, $3, $4, $5, 0.0000)`,
        [portfolio_id, instrument_id, transaction.transaction_id, transaction_date, quantity]
      );
    } 
    
    else if (type === 'SPLIT') {
      // Multiply existing lot quantities and adjust per-share cost proportionally
      if (!ratio_old || !ratio_new) throw new Error('Split ratio required (e.g. ratio_old=1, ratio_new=5)');
      
      const splitFactor = Number(ratio_new) / Number(ratio_old);

      await client.query(
        `UPDATE holdings_fifo 
         SET remaining_quantity = remaining_quantity * $1, 
             cost_per_share = cost_per_share / $1 
         WHERE portfolio_id = $2 AND instrument_id = $3 AND remaining_quantity > 0`,
        [splitFactor, portfolio_id, instrument_id]
      );

      await client.query(
        `INSERT INTO corporate_action_logs (transaction_id, ratio_old, ratio_new) VALUES ($1, $2, $3)`,
        [transaction.transaction_id, ratio_old, ratio_new]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Transaction recorded successfully', transaction });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: 'Transaction failed', error: err.message });
  } finally {
    client.release();
  }
};
