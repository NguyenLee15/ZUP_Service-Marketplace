import { useActiveColors } from '../../../hooks/useActiveColors';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Chip, TextInput } from 'react-native-paper';

type QuickReply = { label?: string; message?: string };

type ChatbotComposerProps = {
  quickReplies: QuickReply[];
  message: string;
  loading: boolean;
  onMessageChange: (value: string) => void;
  onSend: (value: string) => void;
};

export function ChatbotComposer({ quickReplies, message, loading, onMessageChange, onSend }: ChatbotComposerProps) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  return (
    <View style={styles.shell}>
      {quickReplies.length > 0 ? (
        <View style={styles.quickReplyRow}>
          {quickReplies.slice(0, 4).map((reply, index) => (
            <Chip key={`${reply.label || reply.message}-${index}`} mode="outlined" onPress={() => { Haptics.selectionAsync().catch(() => {}); onSend(reply.message || reply.label || ''); }} style={styles.quickReplyChip}>
              {reply.label || reply.message}
            </Chip>
          ))}
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput mode="outlined" label="Bạn cần hỗ trợ gì?" value={message} onChangeText={onMessageChange} multiline numberOfLines={1} maxLength={1200} style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel="Gửi cho AI" disabled={!message.trim() || loading} onPress={() => onSend(message)} style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]}>
          <MaterialCommunityIcons name="send" size={22} color={activeColors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  shell: { padding: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: activeColors.border, backgroundColor: activeColors.surface },
  quickReplyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  quickReplyChip: { borderRadius: 999 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, maxHeight: 120 },
  sendButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: activeColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  sendButtonDisabled: { backgroundColor: activeColors.borderStrong },
});
