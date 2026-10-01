import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { CustomerCard } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatDateTime } from '../../../lib/format';

type BookingScheduleData = {
  timeMode: 'now' | 'scheduled';
  desiredTime: Date | null;
};

type BookingScheduleActions = {
  onModeChange: (mode: 'now' | 'scheduled') => void;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
};

export function BookingScheduleSection({ data, actions }: { data: BookingScheduleData; actions: BookingScheduleActions }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  return (
    <CustomerCard>
      <View style={styles.formBlock}>
        <View style={styles.row}>
          <Button mode={data.timeMode === 'now' ? 'contained-tonal' : 'outlined'} onPress={() => actions.onModeChange('now')} style={[styles.flexButton, data.timeMode === 'now' && styles.activeButton]} icon="lightning-bolt">
            Làm ngay
          </Button>
          <Button mode={data.timeMode === 'scheduled' ? 'contained-tonal' : 'outlined'} onPress={() => actions.onModeChange('scheduled')} style={[styles.flexButton, data.timeMode === 'scheduled' && styles.activeButton]} icon="calendar-clock">
            Hẹn giờ
          </Button>
        </View>

        {data.timeMode === 'scheduled' ? (
          <View style={styles.formBlock}>
            <View style={styles.row}>
              <Button mode="outlined" onPress={actions.onOpenDatePicker} style={styles.flexButton} icon="calendar">
                {data.desiredTime ? data.desiredTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chọn ngày'}
              </Button>
              <Button mode="outlined" onPress={actions.onOpenTimePicker} style={styles.flexButton} icon="clock-outline">
                {data.desiredTime ? data.desiredTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Chọn giờ'}
              </Button>
            </View>
            <HelperText type="info" visible>{data.desiredTime ? `Đã chọn: ${formatDateTime(data.desiredTime)}` : 'Chọn ngày và giờ trong tương lai.'}</HelperText>
          </View>
        ) : (
          <HelperText type="info" visible>Thợ sẽ cố gắng đến hỗ trợ bạn trong thời gian sớm nhất có thể.</HelperText>
        )}
      </View>
    </CustomerCard>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  formBlock: { gap: 12 },
  row: { flexDirection: 'row', gap: 8 },
  flexButton: { flex: 1 },
  activeButton: { borderColor: activeColors.primary, borderWidth: 1 },
});
