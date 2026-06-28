import api from '@/lib/axios';

export const walletApi = {
  getBalance: () =>
    api.get('/provider-wallets/balance'),

  getHistory: (params?: Record<string, unknown>) =>
    api.get('/provider-wallets/history', { params }),

  createDeposit: (amount: number) =>
    api.post('/provider-wallets/deposit', { amount }),
};
