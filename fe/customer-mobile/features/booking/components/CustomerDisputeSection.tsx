import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { CustomerCard, InlineMessage } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import type { CustomerBookingDetail } from './customer-booking-detail.types';

type Props = { booking: CustomerBookingDetail; loading: boolean; chatLoading: boolean; exportLoading: boolean; onCancel: () => void; onChat: () => void; onExport: () => void; onTrack: () => void; onReview: () => void; onDispute: () => void; onAccept: () => void; onRebook: () => void };

export function CustomerDisputeSection({ booking, loading, chatLoading, exportLoading, onCancel, onChat, onExport, onTrack, onReview, onDispute, onAccept, onRebook }: Props) {
  const colors = useActiveColors();
  const status = booking.status || '';
  const canCancel = ['PENDING', 'QUOTED'].includes(status);
  return <View style={styles.stack}>
    <Group title="Theo dõi & liên hệ"><Button mode="outlined" icon="file-pdf-box" loading={exportLoading} disabled={exportLoading} onPress={onExport}>Xuất biên nhận PDF</Button><Button mode="outlined" icon="chat-outline" loading={chatLoading} disabled={chatLoading} onPress={onChat}>Nhắn tin nhà cung cấp</Button>{['CONFIRMED', 'IN_PROGRESS', 'DONE', 'QUOTED'].includes(status) || (status === 'PENDING' && booking.providerAcceptedAt) ? <Button mode="outlined" icon="map-marker-path" onPress={onTrack}>Theo dõi đơn</Button> : null}</Group>
    {status === 'DONE' ? <Group title="Hoàn tất"><Button mode="contained" icon="check-circle-outline" loading={loading} disabled={loading} onPress={onAccept}>Xác nhận hoàn thành</Button><Button mode="outlined" icon="star-outline" onPress={onReview}>Đánh giá</Button></Group> : null}
    <Group title="Khác">{canCancel ? <Button mode="outlined" icon="close-circle-outline" disabled={loading} onPress={onCancel} textColor={colors.error} style={{ borderColor: `${colors.error}55` }}>Hủy đơn</Button> : null}{['DONE', 'DISPUTED'].includes(status) ? status === 'DISPUTED' ? <InlineMessage tone="warning" message={booking.disputeReason || 'Đơn hàng đang trong trạng thái tranh chấp.'} /> : <Button mode="outlined" icon="scale-balance" onPress={onDispute}>Gửi tranh chấp</Button> : null}{['CANCELLED', 'REJECTED', 'DONE'].includes(status) ? <Button mode="text" icon="repeat" loading={loading} disabled={loading} onPress={onRebook}>Đặt lại dịch vụ này</Button> : null}</Group>
  </View>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) { const colors = useActiveColors(); return <CustomerCard><View style={styles.group}><Text variant="titleMedium" style={{ color: colors.text, fontWeight: '900' }}>{title}</Text>{children}</View></CustomerCard>; }
const styles = StyleSheet.create({ stack: { gap: 12 }, group: { gap: 10 } });
