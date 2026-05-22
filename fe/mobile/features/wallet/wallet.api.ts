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

  /** POST /provider-wallets/manual-deposits */
  createManualDeposit: (data: {
    amount: number;
    transferCode?: string;
    receiptUrl?: string;
  }) => api.post('/provider-wallets/manual-deposits', data),

  /** GET /provider-wallets/manual-deposits */
  getManualDeposits: (params?: { page?: number; limit?: number }) =>
    api.get('/provider-wallets/manual-deposits', { params }),

  /** POST /provider-wallets/withdrawals */
  createWithdrawal: (data: {
    amount: number;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
  }) => api.post('/provider-wallets/withdrawals', data),

  /** GET /provider-wallets/withdrawals */
  getWithdrawals: (params?: { page?: number; limit?: number }) =>
    api.get('/provider-wallets/withdrawals', { params }),
};
