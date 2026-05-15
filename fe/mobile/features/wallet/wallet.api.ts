/**
 * Provider Wallet API
 */
import api from '../../lib/axios';

export const walletApi = {
  /** GET /provider-wallets/balance */
  getBalance: () => api.get('/provider-wallets/balance'),

  /** GET /provider-wallets/history */
  getHistory: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/provider-wallets/history', { params }),

  /** POST /provider-wallets/deposit */
  deposit: (amount: number) => api.post('/provider-wallets/deposit', { amount }),
};
