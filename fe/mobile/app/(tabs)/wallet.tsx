/**
 * Wallet Tab - Provider wallet + VNPay deposit.
 */
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
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

export default function WalletScreen() {
  const theme = useTheme();

  const [balance, setBalance] = useState(0);
  const [isRestricted, setIsRestricted] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [message, setMessage] = useState<MessageState>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await walletApi.getBalance();
      if (res.data?.data) {
        setBalance(res.data.data.balance);
        setIsRestricted(res.data.data.isRestricted);
      }
    } catch {
      setMessage({ tone: 'error', text: 'Chưa tải được số dư ví. Kéo xuống để thử lại.' });
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
    fetchTransactions(1, true);
  }, [fetchWallet, fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchWallet();
    await fetchTransactions(1, true);
    setRefreshing(false);
  }, [fetchWallet, fetchTransactions]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const handleDeposit = async () => {
    const amount = Number.parseInt(depositAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount < 10000) {
      setDepositError('Số tiền tối thiểu là 10.000đ.');
      return;
    }

    setDepositError('');
    setDepositLoading(true);
    try {
      const res = await walletApi.deposit(amount);
      const url = res.data?.data?.url;
      if (!url) throw new Error('Không lấy được link thanh toán');

      setShowDepositModal(false);
      setDepositAmount('');
      setMessage({ tone: 'info', text: 'Đang mở VNPay. Sau khi thanh toán, ví sẽ tự tải lại.' });

      await WebBrowser.openBrowserAsync(url);
      await fetchWallet();
      await fetchTransactions(1, true);
    } catch (err: any) {
      setDepositError(err?.message || 'Có lỗi xảy ra khi tạo giao dịch.');
    } finally {
      setDepositLoading(false);
    }
  };

  const getTxColor = (type: string, status: string) => {
    if (status === 'PENDING') return Colors.light.warning;
    if (status === 'FAILED') return Colors.light.error;
    if (type === 'DEPOSIT') return Colors.light.success;
    if (type === 'COMMISSION' || type === 'PENALTY') return Colors.light.error;
    return Colors.light.textSecondary;
  };

  const getTxLabel = (type: string) => {
    if (type === 'DEPOSIT') return 'Nạp tiền VNPay';
    if (type === 'COMMISSION') return 'Trừ hoa hồng';
    if (type === 'PENALTY') return 'Trừ tiền phạt';
    return 'Giao dịch ví';
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const color = getTxColor(item.type, item.status);
    const isPositive = item.type === 'DEPOSIT';
    const sign = isPositive ? '+' : '-';

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
            {sign}
            {formatCurrency(item.amount)}
          </Text>
          <Chip compact style={[styles.statusChip, { backgroundColor: `${color}14` }]} textStyle={{ color }}>
            {item.status}
          </Chip>
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
              subtitle="Theo dõi số dư, phí hoa hồng và lịch sử nạp tiền."
              action={
                <Button
                  mode="contained"
                  icon="plus"
                  compact
                  onPress={() => setShowDepositModal(true)}
                  style={styles.headerButton}
                >
                  Nạp tiền
                </Button>
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
              description="Các lần nạp tiền, trừ hoa hồng và phí phạt sẽ xuất hiện tại đây."
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
            setDepositError('');
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Nạp tiền vào ví
          </Text>
          <Text variant="bodySmall" style={styles.modalDescription}>
            Số tiền tối thiểu là 10.000đ. Bạn sẽ được chuyển sang VNPay để hoàn tất thanh toán.
          </Text>

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
            {depositLoading ? 'Đang xử lý…' : 'Thanh toán qua VNPay'}
          </Button>
          <Button mode="text" onPress={() => setShowDepositModal(false)} style={styles.cancelButton}>
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
    maxWidth: 126,
  },
  txAmount: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statusChip: {
    marginTop: 4,
    height: 26,
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
