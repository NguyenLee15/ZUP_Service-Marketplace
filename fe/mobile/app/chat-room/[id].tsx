/**
 * Chat Room — UC18.1 (realtime messaging)
 * Socket.io + message history + typing indicator
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, IconButton, useTheme, ActivityIndicator, TouchableRipple } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Socket } from 'socket.io-client';
import { chatApi } from '../../features/chat/chat.api';
import { getChatSocket } from '../../lib/socket';
import { useAuthStore } from '../../features/auth/auth.store';
import { Colors } from '../../constants/colors';
import { ProviderEmptyState } from '../../components/provider/provider-ui';

export default function ChatRoomScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id, customerName, serviceName, contextType } = useLocalSearchParams<{
    id: string;
    customerName: string;
    serviceName?: string;
    contextType?: string;
  }>();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kết nối socket + tải lịch sử
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Tải lịch sử tin nhắn
      try {
        const res = await chatApi.getMessages(Number(id));
        if (mounted) setMessages(res.data?.data || []);
      } catch {}
      setLoading(false);

      // Load Smart Replies ban đầu
      fetchSmartReplies();

      // Kết nối socket
      const socket = await getChatSocket();
      socketRef.current = socket;

      socket.emit('joinConversation', { conversationId: Number(id) });

      socket.on('newMessage', (msg: any) => {
        if (mounted) {
          setMessages((prev) => [...prev, msg]);
          setTyping(false);
          // Nếu tin nhắn từ người khác, update Smart Replies
          if (msg.senderId !== user?.id) {
            fetchSmartReplies();
          }
        }
      });

      socket.on('typing', (data: any) => {
        if (data.userId !== user?.id && mounted) {
          setTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
        }
      });
    };

    init();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [id]);

  const fetchSmartReplies = async () => {
    setLoadingReplies(true);
    try {
      const res = await chatApi.getSmartReplies(Number(id));
      if (res.data?.data) {
        setSmartReplies(res.data.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingReplies(false);
    }
  };

  // Gửi tin nhắn
  const handleSend = useCallback(() => {
    if (!inputText.trim() || !socketRef.current) return;
    setSending(true);
    socketRef.current.emit('sendMessage', {
      conversationId: Number(id),
      content: inputText.trim(),
    });
    setInputText('');
    setSending(false);
  }, [inputText, id]);

  // Gửi typing event (debounce)
  const handleTyping = useCallback(() => {
    socketRef.current?.emit('typing', { conversationId: Number(id) });
  }, [id]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;
    const isAi = item.isAiGenerated || item.senderType === 'AI';

    return (
      <View style={[styles.msgContainer, isMe ? styles.msgRight : styles.msgLeft]}>
        {isAi && (
          <View style={styles.aiLabel}>
            <MaterialCommunityIcons name="robot-outline" size={12} color={Colors.light.secondary} />
            <Text variant="labelSmall" style={{ color: Colors.light.secondary, marginLeft: 2 }}>AI</Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isMe
            ? { backgroundColor: theme.colors.primary }
            : isAi
              ? { backgroundColor: Colors.light.secondary + '15', borderColor: Colors.light.secondary + '30', borderWidth: 1 }
              : { backgroundColor: theme.colors.surfaceVariant },
        ]}>
          <Text variant="bodyMedium" style={{ color: isMe ? '#fff' : theme.colors.onBackground }}>
            {item.content}
          </Text>
          <Text variant="labelSmall" style={[styles.time, { color: isMe ? 'rgba(255,255,255,0.6)' : theme.colors.onSurfaceVariant }]}>
            {formatTime(item.createdAt)}
            {isMe && item.isRead && ' ✓✓'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <IconButton icon="arrow-left" mode="contained-tonal" onPress={() => router.back()} accessibilityLabel="Quay lại" />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.headerTitle}>{customerName || 'Khách hàng'}</Text>
          <Text variant="labelSmall" style={styles.headerSubtitle}>
            {typing
              ? 'Đang gõ...'
              : contextType === 'booking'
                ? `Trao đổi theo đơn hàng${serviceName ? ` - ${serviceName}` : ''}`
                : `Trao đổi theo dịch vụ${serviceName ? ` - ${serviceName}` : ''}`}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <ProviderEmptyState
              icon="chat-processing-outline"
              title="Chưa có tin nhắn"
              description="Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi với khách hàng."
            />
          }
        />
      )}

      {/* Typing indicator */}
      {typing && (
        <View style={styles.typingBar}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>
            Khách hàng đang gõ...
          </Text>
        </View>
      )}

      {smartReplies.length > 0 && !typing && (
        <View style={styles.smartReplySection}>
          <View style={styles.smartReplyHeader}>
            <View style={styles.smartReplyTitleRow}>
              <View style={styles.smartReplyIcon}>
                <MaterialCommunityIcons name="auto-fix" size={14} color={Colors.light.primary} />
              </View>
              <Text variant="labelSmall" style={styles.smartReplyTitle}>Gợi ý trả lời</Text>
            </View>
            <Text variant="labelSmall" style={styles.smartReplyCount}>{smartReplies.length} gợi ý</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
          >
            {smartReplies.map((reply, index) => (
              <TouchableRipple
                key={index}
                onPress={() => setInputText(reply)}
                style={styles.replyRipple}
              >
                <View style={[styles.replyChip, index === 0 && styles.replyChipFeatured]}>
                  {index === 0 && <MaterialCommunityIcons name="lightning-bolt" size={14} color={Colors.light.primary} />}
                  <Text variant="bodySmall" style={[styles.replyText, index === 0 && { color: Colors.light.primary }]}>
                    {reply}
                  </Text>
                </View>
              </TouchableRipple>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        <TextInput
          value={inputText}
          onChangeText={(text) => { setInputText(text); handleTyping(); }}
          placeholder="Nhập tin nhắn…"
          mode="outlined"
          style={styles.textInput}
          outlineStyle={{ borderRadius: 24 }}
          dense
          multiline
          maxLength={2000}
        />
        <IconButton
          icon="send"
          iconColor="#fff"
          containerColor={theme.colors.primary}
          size={20}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={styles.sendBtn}
          accessibilityLabel="Gửi tin nhắn"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 44,
    paddingBottom: 10,
    paddingRight: 16,
    paddingLeft: 8,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  messageList: { padding: 16, paddingBottom: 8 },
  msgContainer: { marginBottom: 8, maxWidth: '80%' },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end' },
  aiLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, marginLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  time: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  typingBar: { paddingHorizontal: 20, paddingVertical: 4 },
  smartReplySection: {
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
  },
  smartReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  smartReplyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smartReplyIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.light.primary}14`,
  },
  smartReplyTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  smartReplyCount: {
    color: Colors.light.textSecondary,
    fontWeight: '700',
  },
  replyRipple: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  replyChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyChipFeatured: {
    borderColor: `${Colors.light.primary}55`,
    backgroundColor: `${Colors.light.primary}0D`,
  },
  replyText: {
    color: Colors.light.textSecondary,
    fontWeight: '700',
  },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingBottom: 24, borderTopWidth: 1, gap: 4 },
  textInput: { flex: 1, maxHeight: 100 },
  sendBtn: { marginBottom: 4 },
});
