export type WalletTransactionItem = {
  id: number;
  type: string;
  status: string;
  amount: number | string;
  createdAt: string;
  booking?: {
    bookingCode?: string;
  } | null;
};

export type WalletRequest = {
  id: number;
  amount: number | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  adminNote?: string | null;
  transferCode?: string | null;
  bankName?: string;
  bankAccountNumber?: string;
};
