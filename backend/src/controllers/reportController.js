import pool from '../config/db.js';

// Get Current Holdings for a Portfolio
export const getPortfolioHoldings = async (req, res) => {
  const { portfolioId } = req.params;

  try {
    const holdings = await pool.query(
      `SELECT 
          i.symbol, 
          i.company_name, 
          i.isin,
          SUM(h.remaining_quantity) AS total_quantity,
          SUM(h.remaining_quantity * h.cost_per_share) / NULLIF(SUM(h.remaining_quantity), 0) AS avg_cost_per_share,
          SUM(h.remaining_quantity * h.cost_per_share) AS total_invested
       FROM holdings_fifo h
       JOIN instruments i ON h.instrument_id = i.instrument_id
       WHERE h.portfolio_id = $1 AND h.remaining_quantity > 0
       GROUP BY i.instrument_id, i.symbol, i.company_name, i.isin`,
      [portfolioId]
    );

    res.status(200).json(holdings.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Consolidated User-Wide Portfolio Summary
export const getUserSummary = async (req, res) => {
  try {
    const summary = await pool.query(
      `SELECT 
          p.portfolio_id,
          p.portfolio_name,
          COALESCE(SUM(h.remaining_quantity * h.cost_per_share), 0) AS total_invested_value,
          COUNT(DISTINCT h.instrument_id) AS total_holdings_count
       FROM portfolios p
       LEFT JOIN holdings_fifo h ON p.portfolio_id = h.portfolio_id AND h.remaining_quantity > 0
       WHERE p.user_id = $1
       GROUP BY p.portfolio_id, p.portfolio_name`,
      [req.user.user_id]
    );

    res.status(200).json(summary.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
