import { useActiveColors } from '../../../hooks/useActiveColors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  AppState,
  TextInput as RNTextInput,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io } from 'socket.io-client';
import { Button, Text, TextInput as PaperTextInput, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  LoadingState,
} from '../../../components/customer/customer-ui';
import { Colors } from '../../../constants/colors';
import { WS_URL } from '../../../constants/api';
import { chatApi } from '../../../features/chat/chat.api';
import { storage } from '../../../lib/storage';
import { getChatSocket } from '../../../lib/socket';
import { getApiErrorMessage, normalizeList, unwrapData } from '../../../lib/api-response';
import { stableKey, routes } from '../../../lib/route-utils';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

type ChatMessage = {
  id?: number | string;
  clientId?: string;
  conversationId?: number | string;
  content?: string | null;
  imageUrl?: string | null;
  messageType?: string | null;
  senderType?: string | null;
  sender?: { role?: string | null; fullName?: string | null } | null;
  createdAt?: string | null;
  recalledAt?: string | null;
  pending?: boolean;
};

function isValidConversationId(value: number) {
  return Number.isFinite(value) && value > 0;
}

function dedupeMessages(items: ChatMessage[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.id || item.clientId || `${item.content}-${item.createdAt || ''}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isMine(message: ChatMessage) {
  return message.senderType === 'CUSTOMER' || message.sender?.role === 'CUSTOMER';
}

function canRecallMessage(message: ChatMessage) {
  if (!isMine(message) || message.pending || message.recalledAt || !message.id) return false;
  if (!message.createdAt) return true;
  const createdAt = new Date(message.createdAt).getTime();
  if (Number.isNaN(createdAt)) return true;
  return Date.now() - createdAt <= 5 * 60 * 1000;
}

function formatMessageTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function getConnectionSubtitle(state: ConnectionState, typing: boolean) {
  if (typing) return 'Đang nhập...';
  if (state === 'connected') return 'Đang kết nối realtime';
  if (state === 'connecting') return 'Đang kết nối...';
  if (state === 'error') return 'Realtime chưa sẵn sàng';
  return 'Đã ngắt kết nối realtime';
}

export default function ChatRoomScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const { id, providerName = 'Nhà cung cấp' } = useLocalSearchParams<{
    id: string;
    providerName?: string;
  }>();
  const router = useRouter();
  const conversationId = Number(id);
  const validConversationId = isValidConversationId(conversationId);
  const queryClient = useQueryClient();
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingAtRef = useRef(0);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [recallingId, setRecallingId] = useState<string | number | null>(null);
  const [attachedImage, setAttachedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Ứng dụng cần quyền truy cập thư viện ảnh để gửi hình.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        setAttachedImage(result.assets[0]);
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      setError('Không thể mở thư viện ảnh.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const messagesQuery = useQuery({
    queryKey: ['chat', conversationId, 'messages'],
    queryFn: async () => normalizeList<ChatMessage>(await chatApi.getMessages(conversationId)),
    enabled: validConversationId,
  });

  const smartQuery = useQuery({
    queryKey: ['chat', conversationId, 'smart-replies'],
    queryFn: async () => normalizeList<string>(await chatApi.getSmartReplies(conversationId)),
    enabled: validConversationId,
    retry: 0,
  });

  const messages = useMemo(() => {
    return dedupeMessages([...(messagesQuery.data || []), ...localMessages]);
  }, [localMessages, messagesQuery.data]);

  const appendMessageToCache = useCallback(
    (message: ChatMessage) => {
      queryClient.setQueryData(['chat', conversationId, 'messages'], (current: ChatMessage[] = []) =>
        dedupeMessages([...current, message]),
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
    [conversationId, queryClient],
  );

  useEffect(() => {
    if (!validConversationId) return;

    let active = true;
    setConnectionState('connecting');
    setError('');

    storage
      .getAccessToken()
      .then((token) => {
        if (!active) return;
        if (!token) {
          setConnectionState('error');
          setError('Phiên đăng nhập chưa sẵn sàng để chat realtime.');
          return;
        }

        const socket = io(`${WS_URL}/chat`, {
          transports: ['websocket'],
          auth: (cb) => {
            storage.getAccessToken().then(t => cb({ token: t }));
          },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          if (!active) return;
          setConnectionState('connected');
          setError('');
          socket.emit('joinConversation', { conversationId });
        });

        socket.on('disconnect', () => {
          if (!active) return;
          setConnectionState('disconnected');
        });

        socket.on('connect_error', (socketError: Error) => {
          if (!active) return;
          setConnectionState('error');
          setError(socketError?.message || 'Không thể kết nối chat realtime.');
        });

        socket.on('newMessage', (message: ChatMessage & { clientId?: string }) => {
          if (!active || Number(message?.conversationId) !== conversationId) return;
          appendMessageToCache(message);
          setLocalMessages((current) =>
            current.filter((item) => item.clientId !== message.clientId && item.id !== message.clientId),
          );
        });

        socket.on('typing', () => {
          if (!active) return;
          setTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTyping(false), 1400);
        });

        socket.on('messageRecalled', (message: ChatMessage) => {
          if (!active || Number(message?.conversationId) !== conversationId) return;
          queryClient.setQueryData(['chat', conversationId, 'messages'], (current: ChatMessage[] = []) =>
            current.map((item) => (String(item.id) === String(message.id) ? message : item)),
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        });
      })
      .catch((err) => {
        if (!active) return;
        setConnectionState('error');
        setError(err?.message || 'Không thể đọc phiên đăng nhập.');
      });

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && socketRef.current) {
        if (!socketRef.current.connected) {
          socketRef.current.connect();
        }
      }
    });

    return () => {
      active = false;
      subscription.remove();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const socket = socketRef.current;
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('newMessage');
        socket.off('typing');
        socket.off('messageRecalled');
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [appendMessageToCache, conversationId, queryClient, validConversationId]);

  const send = async () => {
    const content = text.trim();
    if (!content && !attachedImage) return;
    if (connectionState !== 'connected') return;

    const clientId = `local-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: clientId,
      clientId,
      conversationId,
      content: content || (attachedImage ? '[Hình ảnh]' : ''),
      imageUrl: attachedImage ? attachedImage.uri : null,
      messageType: attachedImage ? 'IMAGE' : 'TEXT',
      senderType: 'CUSTOMER',
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((current) => [...current, optimisticMessage]);
    setText('');
    const currentAttachedImage = attachedImage;
    setAttachedImage(null);
    Haptics.selectionAsync().catch(() => {});

    try {
      let finalImageUrl = undefined;
      let finalMessageType = 'TEXT';

      if (currentAttachedImage) {
        const file = {
          uri: currentAttachedImage.uri,
          name: currentAttachedImage.fileName || `image-${Date.now()}.jpg`,
          type: currentAttachedImage.mimeType || 'image/jpeg',
        };
        const res = await chatApi.uploadChatImage(file);
        if (res.data?.success && res.data?.data?.imageUrl) {
          finalImageUrl = res.data.data.imageUrl;
          finalMessageType = 'IMAGE';
        }
      }

      socketRef.current?.emit('sendMessage', {
        conversationId,
        content: content || (currentAttachedImage ? '[Hình ảnh]' : ''),
        messageType: finalMessageType,
        imageUrl: finalImageUrl,
        clientId,
      });
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
      // Optional: Handle error by showing a toast and removing optimistic message
    }
  };

  const emitTyping = () => {
    const now = Date.now();
    if (now - lastTypingAtRef.current < 900) return;
    lastTypingAtRef.current = now;
    socketRef.current?.emit('typing', { conversationId });
  };

  const recallMessage = async (message: ChatMessage) => {
    if (!message.id) return;
    setError('');
    setRecallingId(message.id);
    try {
      const response = await chatApi.recallMessage(Number(message.id));
      const recalled = unwrapData<ChatMessage>(response);
      queryClient.setQueryData(['chat', conversationId, 'messages'], (current: ChatMessage[] = []) =>
        current.map((item) => (String(item.id) === String(message.id) ? recalled : item)),
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể thu hồi tin nhắn.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setRecallingId(null);
    }
  };

  if (!validConversationId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="chat-alert-outline"
          title="Cuộc trò chuyện không hợp lệ"
          description="Vui lòng quay lại danh sách tin nhắn."
          actionLabel="Về tin nhắn"
          onAction={() => router.replace(routes.tabs.chat)}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
      <FlashList
        data={messagesQuery.isLoading ? [] : messages}
        keyExtractor={(item: ChatMessage, index) => stableKey(item.id || item.clientId, `message-${index}`)}
        contentContainerStyle={styles.listContent}
        refreshing={messagesQuery.isRefetching}
        onRefresh={() => messagesQuery.refetch()}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <CustomerHeader
              title={String(providerName)}
              subtitle={getConnectionSubtitle(connectionState, typing)}
            />
            {error || messagesQuery.isError ? (
              <InlineMessage tone="error" message={error || 'Không thể tải tin nhắn.'} />
            ) : null}
            {connectionState === 'disconnected' ? (
              <InlineMessage tone="warning" message="Realtime đã ngắt. Kéo để làm mới lịch sử tin nhắn." />
            ) : null}
            {messagesQuery.isLoading ? <LoadingState label="Đang tải tin nhắn..." /> : null}
          </View>
        }
        ListEmptyComponent={
          !messagesQuery.isLoading ? (
            <EmptyState
              icon="chat-outline"
              title="Chưa có tin nhắn"
              description="Bắt đầu trao đổi với nhà cung cấp về yêu cầu của bạn."
            />
          ) : null
        }
        renderItem={({ item: message }: { item: ChatMessage }) => (
          <MessageBubble
            message={message}
            providerName={String(providerName)}
            recalling={String(recallingId || '') === String(message.id || '')}
            onRecall={() => recallMessage(message)}
          />
        )}
      />

      <View style={styles.inputShell}>
        {attachedImage ? (
          <View style={styles.attachmentPreview}>
            <Image source={{ uri: attachedImage.uri }} style={styles.previewThumb} contentFit="cover" />
            <View style={styles.previewInfo}>
              <Text variant="bodySmall" numberOfLines={1}>
                {attachedImage.fileName || 'Ảnh đính kèm'}
              </Text>
              <Text variant="labelSmall" style={{ color: activeColors.textSecondary }}>
                {((attachedImage.fileSize || 0) / 1024).toFixed(1)} KB
              </Text>
            </View>
            <Pressable
              style={styles.removePreviewBtn}
              onPress={() => {
                setAttachedImage(null);
                Haptics.selectionAsync().catch(() => {});
              }}
            >
              <MaterialCommunityIcons name="close" size={14} color="#FFF" />
            </Pressable>
          </View>
        ) : null}

        {(smartQuery.data || []).length > 0 ? (
          <View style={styles.suggestionRow}>
            {(smartQuery.data || []).slice(0, 3).map((item) => (
              <Button
                key={item}
                mode="outlined"
                compact
                onPress={() => {
                  setText(item);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={styles.suggestionButton}
              >
                {item}
              </Button>
            ))}
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <Pressable
            style={styles.attachmentBtn}
            onPress={pickImage}
            accessibilityRole="button"
            accessibilityLabel="Đính kèm hình ảnh"
          >
            <MaterialCommunityIcons name="image-outline" size={22} color={activeColors.primary} />
          </Pressable>
          <RNTextInput
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={activeColors.textSecondary}
            value={text}
            onChangeText={(value) => {
              setText(value);
              emitTyping();
            }}
            multiline
            maxLength={1200}
            style={[
              styles.input,
              {
                color: activeColors.text,
                backgroundColor: activeColors.surfaceVariant,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingTop: Platform.OS === 'ios' ? 10 : 8,
                paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                minHeight: 40,
                maxHeight: 120,
                borderWidth: 1,
                borderColor: activeColors.border,
              }
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            disabled={(!text.trim() && !attachedImage) || connectionState !== 'connected'}
            onPress={send}
            style={[
              styles.sendButton,
              ((!text.trim() && !attachedImage) || connectionState !== 'connected') ? styles.sendButtonDisabled : null,
            ]}
          >
            <MaterialCommunityIcons name="send" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  providerName,
  recalling,
  onRecall,
}: {
  message: ChatMessage;
  providerName: string;
  recalling: boolean;
  onRecall: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const mine = isMine(message);
  const ai = message.senderType === 'AI';
  const recalled = Boolean(message.recalledAt);

  return (
    <View style={[styles.messageWrap, { alignItems: mine ? 'flex-end' : 'flex-start', flexDirection: mine ? 'row-reverse' : 'row' }]}>
      {!mine && (
        <Avatar.Text
          size={28}
          label={message.sender?.fullName ? message.sender.fullName.charAt(0).toUpperCase() : providerName ? providerName.charAt(0).toUpperCase() : 'T'}
          style={{ marginRight: 8, marginBottom: 2, alignSelf: 'flex-end' }}
        />
      )}
      <View style={{ flexShrink: 1 }}>
        <CustomerCard
        style={[
          styles.bubble,
          mine ? styles.mineBubble : null,
          ai ? styles.aiBubble : null,
        ]}
      >
        {recalled ? (
          <View style={styles.recalledRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={activeColors.textSecondary} />
            <Text variant="bodyMedium" style={styles.recalledText}>
              Tin nhắn đã được thu hồi
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {message.imageUrl ? (
              <Image source={{ uri: message.imageUrl }} style={styles.bubbleImage} contentFit="cover" transition={160} />
            ) : null}
            {message.content ? (
              <Text variant="bodyMedium" style={[styles.messageText, mine && styles.mineMessageText]}>
                {message.content}
              </Text>
            ) : null}
          </View>
        )}
        <View style={styles.messageMeta}>
          {message.pending ? (
            <Text variant="labelSmall" style={mine ? styles.mineMetaText : styles.metaText}>
              Đang gửi
            </Text>
          ) : null}
          {message.createdAt ? (
            <Text variant="labelSmall" style={mine ? styles.mineMetaText : styles.metaText}>
              {formatMessageTime(message.createdAt)}
            </Text>
          ) : null}
        </View>
        {canRecallMessage(message) ? (
          <Button
            compact
            mode="text"
            loading={recalling}
            disabled={recalling}
            onPress={onRecall}
            labelStyle={mine ? { color: activeColors.primary } : undefined}
            accessibilityLabel="Thu hồi tin nhắn của tôi"
          >
            Thu hồi
          </Button>
        ) : null}
      </CustomerCard>
      </View>
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: activeColors.background },
  listContent: { padding: 16, paddingBottom: 20 },
  headerWrap: { gap: 10, marginBottom: 12 },
  messageWrap: { marginBottom: 8 },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mineBubble: {
    backgroundColor: activeColors.primarySoft,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  aiBubble: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  messageText: { color: activeColors.text, lineHeight: 21 },
  recalledText: { color: activeColors.textSecondary, fontStyle: 'italic' },
  messageMeta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 4 },
  metaText: { color: activeColors.textSecondary },
  inputShell: {
    padding: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: activeColors.border,
    backgroundColor: '#FFFFFF',
  },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  suggestionButton: { borderRadius: 999 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, maxHeight: 120 },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: activeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: { backgroundColor: activeColors.borderStrong },
  recalledRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bubbleImage: { width: 220, height: 160, borderRadius: 12, backgroundColor: activeColors.surfaceVariant },
  mineMessageText: { color: activeColors.text },
  mineMetaText: { color: activeColors.textSecondary },
  // Image attachments UI
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  previewThumb: { width: 44, height: 44, borderRadius: 8 },
  previewInfo: { flex: 1 },
  removePreviewBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: activeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    backgroundColor: '#F9FAFB',
  },
});
