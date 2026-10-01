import { StyleSheet, View } from 'react-native';
import { Chip, Text, TextInput } from 'react-native-paper';

import { CustomerCard } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';

export type BookingQuestion = { q: string; options: string[] };

type BookingQuestionnaireSectionProps = {
  questionnaire: BookingQuestion[];
  selectedChips: string[];
  customText: string;
  onToggleChip: (option: string) => void;
  onCustomTextChange: (value: string) => void;
};

export function BookingQuestionnaireSection({
  questionnaire,
  selectedChips,
  customText,
  onToggleChip,
  onCustomTextChange,
}: BookingQuestionnaireSectionProps) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  return (
    <CustomerCard>
      <View style={styles.formBlock}>
        {questionnaire.map((block) => (
          <View key={block.q} style={styles.formBlock}>
            <Text variant="labelLarge" style={styles.fieldLabel}>
              {block.q}
            </Text>
            <View style={styles.chipWrap}>
              {block.options.map((option) => (
                <Chip
                  key={option}
                  selected={selectedChips.includes(option)}
                  mode={selectedChips.includes(option) ? 'flat' : 'outlined'}
                  onPress={() => onToggleChip(option)}
                  accessibilityLabel={`Chọn tình trạng ${option}`}
                  style={styles.chip}
                >
                  {option}
                </Chip>
              ))}
            </View>
          </View>
        ))}
        <TextInput
          label="Mô tả thêm"
          mode="outlined"
          value={customText}
          onChangeText={onCustomTextChange}
          multiline
          numberOfLines={4}
          placeholder="Ví dụ: thời điểm xuất hiện lỗi, diện tích, yêu cầu riêng..."
        />
      </View>
    </CustomerCard>
  );
}

const getStyles = (activeColors: ReturnType<typeof useActiveColors>) =>
  StyleSheet.create({
    formBlock: { gap: 12 },
    fieldLabel: { color: activeColors.textSecondary, fontWeight: '800' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderRadius: 999 },
  });
