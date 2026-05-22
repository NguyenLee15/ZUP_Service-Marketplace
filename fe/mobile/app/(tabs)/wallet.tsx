/**
 * Wallet Tab - Provider wallet, VNPay sandbox and manual transfer requests.
 */
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Modal, Portal, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { walletApi } from '../../features/wallet/wallet.api';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderScreen,
  ProviderSectionHeader,
} from '../../components/provider/provider-ui';

WebBrowser.maybeCompleteAuthSession();

type MessageState = {
  tone: 'info' | 'success' | 'warning' | 'error';
  text: string;
} | null;

type WalletRequest = {
  id: number;
  amount: number | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  adminNote?: string | null;
  transferCode?: string | null;
  bankName?: string;
  bankAccountNumber?: string;
};

const MANUAL_BANK_INFO = {
  bankName: 'Ngân hàng của nền tảng',
  accountNumber: 'Cấu hình số tài khoản admin',
  holder: 'Chủ tài khoản nền tảng',
};

export default function WalletScreen() {
  const theme = useTheme();

  const [balance, setBalance] = useState(0);
  const [isRestricted, setIsRestricted] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [manualDeposits, setManualDeposits] = useState<WalletRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletRequest[]>([]);
  const [message, setMessage] = useState<MessageState>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositMode, setDepositMode] = useState<'vnpay' | 'manual'>('manual');
  const [depositAmount, setDepositAmount] = useState('');
  const [transferCode, setTransferCode] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await walletApi.getBalance();
      if (res.data?.data) {
        setBalance(Number(res.data.data.balance || 0));
        setIsRestricted(Boolean(res.data.data.isRestricted));
      }
    } catch {
      setMessage({ tone: 'error', text: 'Chưa tải được số dư ví. Kéo xuống để thử lại.' });
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const [depositRes, withdrawalRes] = await Promise.all([
        walletApi.getManualDeposits({ page: 1, limit: 5 }),
        walletApi.getWithdrawals({ page: 1, limit: 5 }),
      ]);
      setManualDeposits(depositRes.data?.data || []);
      setWithdrawals(withdrawalRes.data?.data || []);
    } catch {
      setMessage({ tone: 'warning', text: 'Chưa tải được trạng thái yêu cầu nạp/rút.' });
    }
  }, []);

  const fetchTransactions = useCallback(async (p = 1, reset = false) => {
    try {
      const res = await walletApi.getHistory({ page: p, limit: 15 });
      const data = res.data?.data || [];
      const meta = res.data?.meta;

      if (reset || p === 1) setTransactions(data);
      else setTransactions(prev => [...prev, ...data]);

      setHasMore(meta ? p < meta.totalPages : data.length === 15);
      setPage(p);
    } catch {
      setMessage({ tone: 'error', text: 'Chưa tải được lịch sử giao dịch.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchRequests();
    fetchTransactions(1, true);
  }, [fetchWallet, fetchRequests, fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchWallet();
    await fetchRequests();
    await fetchTransactions(1, true);
    setRefreshing(false);
  }, [fetchWallet, fetchRequests, fetchTransactions]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const parseMoney = (value: string) => Number.parseInt(value.replace(/[^0-9]/g, ''), 10);

  const resetDepositForm = () => {
    setDepositAmount('');
    setTransferCode('');
    setDepositError('');
  };

  const handleDeposit = async () => {
    const amount = parseMoney(depositAmount);
    if (!amount || amount < 10000) {
      setDepositError('Số tiền tối thiểu là 10.000đ.');
      return;
    }

    setDepositError('');
    setDepositLoading(true);
    try {
      if (depositMode === 'manual') {
        await walletApi.createManualDeposit({ amount, transferCode });
        setShowDepositModal(false);
        resetDepositForm();
        setMessage({
          tone: 'success',
          text: 'Đã gửi yêu cầu nạp thủ công. Admin sẽ kiểm tra chuyển khoản và cộng ví.',
        });
        await fetchRequests();
        return;
      }

      const res = await walletApi.deposit(amount);
      const paymentUrl = res.data?.data?.paymentUrl || res.data?.data?.url;
      if (!paymentUrl) throw new Error('Không lấy được link thanh toán');

      setShowDepositModal(false);
      resetDepositForm();
      setMessage({ tone: 'info', text: 'Đang mở VNPay sandbox. Sau khi thanh toán, ví sẽ tự tải lại.' });

      await WebBrowser.openBrowserAsync(paymentUrl);
      await fetchWallet();
      await fetchTransactions(1, true);
    } catch (err: any) {
      setDepositError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.message ||
          'Có lỗi xảy ra khi tạo giao dịch.',
      );
    } finally {
      setDepositLoading(false);
    }
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount('');
    setBankName('');
    setBankAccountNumber('');
    setBankAccountHolder('');
    setWithdrawError('');
  };

  const handleWithdraw = async () => {
    const amount = parseMoney(withdrawAmount);
    if (!amount || amount < 50000) {
      setWithdrawError('Số tiền rút tối thiểu là 50.000đ.');
      return;
    }
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountHolder.trim()) {
      setWithdrawError('Vui lòng nhập đầy đủ ngân hàng, số tài khoản và tên chủ tài khoản.');
      return;
    }

    setWithdrawError('');
    setWithdrawLoading(true);
    try {
      await walletApi.createWithdrawal({
        amount,
        bankName,
        bankAccountNumber,
        bankAccountHolder,
      });
      setShowWithdrawModal(false);
      resetWithdrawForm();
      setMessage({ tone: 'success', text: 'Đã gửi yêu cầu rút tiền. Admin sẽ chuyển khoản thủ công sau khi kiểm tra.' });
      await fetchRequests();
    } catch (err: any) {
      setWithdrawError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.message ||
          'Có lỗi xảy ra khi tạo yêu cầu rút tiền.',
      );
    } finally {
      setWithdrawLoading(false);
    }
  };

  const getTxColor = (type: string, status: string) => {
    if (status === 'PENDING') return Colors.light.warning;
    if (status === 'FAILED') return Colors.light.error;
    if (type === 'DEPOSIT') return Colors.light.success;
    if (type === 'COMMISSION' || type === 'PENALTY' || type === 'WITHDRAWAL') return Colors.light.error;
    return Colors.light.textSecondary;
  };

  const getTxLabel = (type: string) => {
    if (type === 'DEPOSIT') return 'Nạp tiền';
    if (type === 'WITHDRAWAL') return 'Rút tiền';
    if (type === 'COMMISSION') return 'Trừ hoa hồng';
    if (type === 'PENALTY') return 'Trừ tiền phạt';
    return 'Giao dịch ví';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'SUCCESS') return 'Thành công';
    if (status === 'FAILED') return 'Thất bại';
    if (status === 'PENDING') return 'Đang chờ';
    if (status === 'APPROVED') return 'Đã xử lý';
    if (status === 'REJECTED') return 'Từ chối';
    return status;
  };

  const getRequestTone = (status: string) => {
    if (status === 'APPROVED') return Colors.light.success;
    if (status === 'REJECTED') return Colors.light.error;
    return Colors.light.warning;
  };

  const renderRequest = (item: WalletRequest, type: 'deposit' | 'withdrawal') => {
    const color = getRequestTone(item.status);
    return (
      <ProviderCard key={`${type}-${item.id}`} style={styles.requestCard} contentStyle={styles.requestContent}>
        <View style={[styles.requestIcon, { backgroundColor: `${color}16` }]}>
          <MaterialCommunityIcons
            name={type === 'deposit' ? 'bank-transfer-in' : 'bank-transfer-out'}
            size={22}
            color={color}
          />
        </View>
        <View style={styles.requestBody}>
          <Text variant="bodyMedium" style={styles.requestTitle} numberOfLines={1}>
            {type === 'deposit' ? 'Nạp thủ công' : 'Rút tiền'} {formatCurrency(Number(item.amount || 0))}
          </Text>
          <Text variant="bodySmall" style={styles.txMeta} numberOfLines={1}>
            {new Date(item.createdAt).toLocaleString('vi-VN')}
          </Text>
          {item.adminNote ? (
            <Text variant="labelSmall" style={styles.txMeta} numberOfLines={2}>
              {item.adminNote}
            </Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${color}14` }]}>
          <Text variant="labelSmall" style={[styles.statusBadgeText, { color }]} numberOfLines={1}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </ProviderCard>
    );
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const color = getTxColor(item.type, item.status);
    const isPositive = item.type === 'DEPOSIT';
    const amount = Math.abs(Number(item.amount || 0));

    return (
      <ProviderCard style={styles.transactionCard} contentStyle={styles.transactionContent}>
        <View style={[styles.txIcon, { backgroundColor: `${color}16` }]}>
          <MaterialCommunityIcons
            name={isPositive ? 'arrow-down-bold' : 'arrow-up-bold'}
            size={22}
            color={color}
          />
        </View>
        <View style={styles.txContent}>
          <Text variant="bodyLarge" style={styles.txTitle} numberOfLines={1}>
            {getTxLabel(item.type)}
          </Text>
          <Text variant="bodySmall" style={styles.txMeta}>
            {new Date(item.createdAt).toLocaleString('vi-VN')}
          </Text>
          {item.booking && (
            <Text variant="labelSmall" style={styles.txMeta} selectable>
              Đơn hàng #{item.booking.bookingCode}
            </Text>
          )}
        </View>
        <View style={styles.txRight}>
          <Text
            variant="titleSmall"
            style={[styles.txAmount, { color: item.status === 'FAILED' ? Colors.light.textSecondary : color }]}
            selectable
          >
            {isPositive ? '+' : '-'}
            {formatCurrency(amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${color}14` }]}>
            <Text variant="labelSmall" style={[styles.statusBadgeText, { color }]} numberOfLines={1}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </ProviderCard>
    );
  };

  return (
    <ProviderScreen>
      <FlatList
        data={transactions}
        keyExtractor={item => String(item.id)}
        renderItem={renderTransaction}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />}
        onEndReached={() => {
          if (hasMore && !loading) fetchTransactions(page + 1);
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <ProviderPageHeader
              title="Ví tiền"
              subtitle="Quản lý số dư, nạp thủ công, rút tiền và hoa hồng."
              action={
                <View style={styles.headerActions}>
                  <Button mode="outlined" icon="bank-transfer-out" compact onPress={() => setShowWithdrawModal(true)} style={styles.headerButton}>
                    Rút tiền
                  </Button>
                  <Button mode="contained" icon="plus" compact onPress={() => setShowDepositModal(true)} style={styles.headerButton}>
                    Nạp tiền
                  </Button>
                </View>
              }
            />

            {message && <ProviderInlineMessage tone={message.tone} message={message.text} />}

            <ProviderCard contentStyle={styles.balanceContent}>
              <View style={styles.balanceTopRow}>
                <View>
                  <Text variant="labelLarge" style={styles.mutedText}>
                    Số dư hiện tại
                  </Text>
                  <Text variant="displaySmall" style={styles.balanceText} selectable>
                    {formatCurrency(balance)}
                  </Text>
                </View>
                <View style={styles.balanceIcon}>
                  <MaterialCommunityIcons name="wallet-outline" size={28} color={Colors.light.primary} />
                </View>
              </View>

              {isRestricted && (
                <ProviderInlineMessage
                  tone="error"
                  icon="alert-circle-outline"
                  message="Tài khoản đang bị giới hạn do số dư âm. Vui lòng nạp thêm tiền để tiếp tục nhận đơn."
                />
              )}
            </ProviderCard>

            {(manualDeposits.length > 0 || withdrawals.length > 0) && (
              <>
                <ProviderSectionHeader title="Yêu cầu gần đây" />
                {manualDeposits.slice(0, 3).map(item => renderRequest(item, 'deposit'))}
                {withdrawals.slice(0, 3).map(item => renderRequest(item, 'withdrawal'))}
              </>
            )}

            <ProviderSectionHeader title="Lịch sử giao dịch" />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
          ) : (
            <ProviderEmptyState
              icon="receipt-text-outline"
              title="Chưa có giao dịch"
              description="Các lần nạp tiền, rút tiền, trừ hoa hồng và phí phạt sẽ xuất hiện tại đây."
              actionLabel="Nạp tiền"
              onAction={() => setShowDepositModal(true)}
            />
          )
        }
        ListFooterComponent={hasMore && transactions.length > 0 ? <ActivityIndicator style={styles.footerLoader} /> : null}
      />

      <Portal>
        <Modal
          visible={showDepositModal}
          onDismiss={() => {
            setShowDepositModal(false);
            resetDepositForm();
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Nạp tiền vào ví
          </Text>
          <SegmentedButtons
            value={depositMode}
            onValueChange={value => {
              setDepositMode(value as 'vnpay' | 'manual');
              setDepositError('');
            }}
            buttons={[
              { value: 'manual', label: 'Chuyển khoản' },
              { value: 'vnpay', label: 'VNPAY sandbox' },
            ]}
          />
          <Text variant="bodySmall" style={styles.modalDescription}>
            {depositMode === 'manual'
              ? 'Chuyển khoản thật vào tài khoản nền tảng, sau đó gửi yêu cầu để admin xác nhận.'
              : 'Thanh toán mô phỏng qua VNPAY sandbox.'}
          </Text>

          {depositMode === 'manual' && (
            <View style={styles.bankInfo}>
              <Text variant="labelLarge" style={styles.bankInfoTitle}>
                Thông tin nhận chuyển khoản
              </Text>
              <Text style={styles.bankLine}>Ngân hàng: {MANUAL_BANK_INFO.bankName}</Text>
              <Text style={styles.bankLine}>Số tài khoản: {MANUAL_BANK_INFO.accountNumber}</Text>
              <Text style={styles.bankLine}>Chủ tài khoản: {MANUAL_BANK_INFO.holder}</Text>
              <Text style={styles.bankHint}>Nội dung gợi ý: NAPVI + số điện thoại tài khoản</Text>
            </View>
          )}

          {depositError ? <ProviderInlineMessage tone="error" message={depositError} /> : null}

          <TextInput
            label="Số tiền (VNĐ)"
            value={depositAmount}
            onChangeText={value => {
              setDepositAmount(value);
              setDepositError('');
            }}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Icon icon="cash" accessibilityLabel="Số tiền" />}
            style={styles.amountInput}
          />

          {depositMode === 'manual' && (
            <TextInput
              label="Mã giao dịch / nội dung chuyển khoản"
              value={transferCode}
              onChangeText={setTransferCode}
              mode="outlined"
              left={<TextInput.Icon icon="identifier" accessibilityLabel="Mã giao dịch" />}
              style={styles.amountInput}
            />
          )}

          <View style={styles.quickAmounts}>
            {[50000, 100000, 200000, 500000].map(amount => (
              <Chip key={amount} onPress={() => setDepositAmount(String(amount))} style={styles.quickChip}>
                {amount / 1000}k
              </Chip>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleDeposit}
            loading={depositLoading}
            disabled={depositLoading || !depositAmount}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            {depositLoading ? 'Đang xử lý...' : depositMode === 'manual' ? 'Gửi yêu cầu nạp' : 'Thanh toán qua VNPAY'}
          </Button>
          <Button mode="text" onPress={() => setShowDepositModal(false)} style={styles.cancelButton}>
            Hủy
          </Button>
        </Modal>

        <Modal
          visible={showWithdrawModal}
          onDismiss={() => {
            setShowWithdrawModal(false);
            resetWithdrawForm();
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Rút tiền về ngân hàng
          </Text>
          <Text variant="bodySmall" style={styles.modalDescription}>
            Admin sẽ chuyển khoản thủ công sau khi kiểm tra yêu cầu. Số tiền tối thiểu là 50.000đ.
          </Text>

          {withdrawError ? <ProviderInlineMessage tone="error" message={withdrawError} /> : null}

          <TextInput
            label="Số tiền rút (VNĐ)"
            value={withdrawAmount}
            onChangeText={value => {
              setWithdrawAmount(value);
              setWithdrawError('');
            }}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Icon icon="cash-minus" accessibilityLabel="Số tiền rút" />}
            style={styles.amountInput}
          />
          <TextInput
            label="Ngân hàng"
            value={bankName}
            onChangeText={setBankName}
            mode="outlined"
            left={<TextInput.Icon icon="bank" accessibilityLabel="Ngân hàng" />}
            style={styles.amountInput}
          />
          <TextInput
            label="Số tài khoản"
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            mode="outlined"
            keyboardType="number-pad"
            left={<TextInput.Icon icon="credit-card-outline" accessibilityLabel="Số tài khoản" />}
            style={styles.amountInput}
          />
          <TextInput
            label="Tên chủ tài khoản"
            value={bankAccountHolder}
            onChangeText={setBankAccountHolder}
            mode="outlined"
            autoCapitalize="characters"
            left={<TextInput.Icon icon="account" accessibilityLabel="Tên chủ tài khoản" />}
            style={styles.amountInput}
          />

          <Button
            mode="contained"
            onPress={handleWithdraw}
            loading={withdrawLoading}
            disabled={withdrawLoading || !withdrawAmount}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            {withdrawLoading ? 'Đang gửi...' : 'Gửi yêu cầu rút'}
          </Button>
          <Button mode="text" onPress={() => setShowWithdrawModal(false)} style={styles.cancelButton}>
            Hủy
          </Button>
        </Modal>
      </Portal>
    </ProviderScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 112,
    gap: 12,
  },
  headerStack: {
    gap: 14,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  headerButton: {
    borderRadius: 999,
  },
  balanceContent: {
    gap: 14,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  mutedText: {
    color: Colors.light.textSecondary,
  },
  balanceText: {
    color: Colors.light.text,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  balanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.light.primary}14`,
  },
  requestCard: {
    marginBottom: 8,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBody: {
    flex: 1,
    gap: 2,
  },
  requestTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  transactionCard: {
    marginBottom: 10,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txContent: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  txMeta: {
    color: Colors.light.textSecondary,
  },
  txRight: {
    alignItems: 'flex-end',
    width: 122,
  },
  txAmount: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  statusBadge: {
    marginTop: 4,
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    justifyContent: 'center',
    maxWidth: 112,
  },
  statusBadgeText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  loading: {
    marginTop: 40,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 18,
    gap: 12,
  },
  modalTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  modalDescription: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  bankInfo: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: Colors.light.surfaceVariant,
    gap: 4,
  },
  bankInfoTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  bankLine: {
    color: Colors.light.text,
  },
  bankHint: {
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  amountInput: {
    backgroundColor: Colors.light.surface,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    backgroundColor: Colors.light.surfaceVariant,
  },
  primaryButton: {
    borderRadius: 12,
    marginTop: 4,
  },
  buttonContent: {
    height: 48,
  },
  cancelButton: {
    marginTop: -4,
  },
});
