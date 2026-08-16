import pool from '../config/db.js';

// Get all portfolios for logged-in user
export const getUserPortfolios = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT portfolio_id, portfolio_name, description, created_at FROM portfolios WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.user_id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create a new portfolio
export const createPortfolio = async (req, res) => {
  const { portfolio_name, description } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO portfolios (user_id, portfolio_name, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.user_id, portfolio_name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: 'Portfolio name already exists for this user' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
