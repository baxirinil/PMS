import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getUserSummary, getPortfolioHoldings } from '../services/api';

export default function Dashboard() {
  const { activePortfolio } = useContext(AuthContext);
  const [portfolios, setPortfolios] = useState([]);
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    getUserSummary().then((res) => setPortfolios(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (activePortfolio) {
      getPortfolioHoldings(activePortfolio).then((res) => setHoldings(res.data)).catch(console.error);
    }
  }, [activePortfolio]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Portfolio Overview</h1>
      
      {/* Portfolio Summaries */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        {portfolios.map((p) => (
          <div key={p.portfolio_id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', minWidth: '200px' }}>
            <h3>{p.portfolio_name}</h3>
            <p>Holdings: {p.total_holdings_count}</p>
            <p>Invested: ₹{Number(p.total_invested_value).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <h2>Current Holdings</h2>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Symbol</th>
            <th>Company Name</th>
            <th>Quantity</th>
            <th>Avg. Cost</th>
            <th>Total Invested</th>
          </tr>
        </thead>
        <tbody>
          {holdings.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No holdings found in selected portfolio.</td></tr>
          ) : (
            holdings.map((h, i) => (
              <tr key={i}>
                <td><strong>{h.symbol}</strong></td>
                <td>{h.company_name}</td>
                <td>{h.total_quantity}</td>
                <td>₹{Number(h.avg_cost_per_share).toFixed(2)}</td>
                <td>₹{Number(h.total_invested).toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
