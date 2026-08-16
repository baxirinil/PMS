import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
});

// Auto-attach JWT authorization token from LocalStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getPortfolios = () => API.get('/portfolios');
export const createPortfolio = (data) => API.post('/portfolios', data);
export const addTransaction = (data) => API.post('/transactions', data);
export const getPortfolioHoldings = (portfolioId) => API.get(`/reports/portfolio/${portfolioId}/holdings`);
export const getUserSummary = () => API.get('/reports/user/summary');

export default API;
