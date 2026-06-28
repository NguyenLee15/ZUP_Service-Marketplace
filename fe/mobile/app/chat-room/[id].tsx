/**
 * Chat Room — UC18.1 (realtime messaging)
 * Socket.io + message history + typing indicator
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput, Image, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme, ActivityIndicator, TouchableRipple, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { chatApi } from '../../features/chat/chat.api';
import { getChatSocket } from '../../lib/socket';
import { useAuthStore } from '../../features/auth/auth.store';
import { Colors } from '../../constants/colors';
import { ProviderEmptyState } from '../../components/provider/provider-ui';

export default function ChatRoomScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, insets);
  const router = useRouter();
  const { id, customerName, serviceName, contextType, serviceId } = useLocalSearchParams<{
    id: string;
    customerName: string;
    serviceName?: string;
    contextType?: string;
    serviceId?: string;
  }>();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [attachedImage, setAttachedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const flashListRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kết nối socket + tải lịch sử
  useEffect(() => {
    let mounted = true;
    let activeSocket: Socket | null = null;

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
      activeSocket = socket;

      socket.emit('joinConversation', { conversationId: Number(id) });

      const handleNewMessage = (msg: any) => {
        if (mounted) {
          setMessages((prev) => [...prev, msg]);
          setTyping(false);
          if (msg.senderId !== user?.id) {
            fetchSmartReplies();
          }
        }
      };

      const handleTypingEvent = (data: any) => {
        if (data.userId !== user?.id && mounted) {
          setTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
        }
      };

      const handleMessageRecalled = (recalledMsg: any) => {
        if (mounted) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === recalledMsg.id ? { ...msg, ...recalledMsg } : msg
            )
          );
        }
      };

      socket.on('newMessage', handleNewMessage);
      socket.on('typing', handleTypingEvent);
      socket.on('messageRecalled', handleMessageRecalled);

      // Save handlers for cleanup
      (socket as any)._chatRoomHandlers = { handleNewMessage, handleTypingEvent, handleMessageRecalled };
    };

    init();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (activeSocket && (activeSocket as any)._chatRoomHandlers) {
        const { handleNewMessage, handleTypingEvent, handleMessageRecalled } = (activeSocket as any)._chatRoomHandlers;
        activeSocket.off('newMessage', handleNewMessage);
        activeSocket.off('typing', handleTypingEvent);
        activeSocket.off('messageRecalled', handleMessageRecalled);
        delete (activeSocket as any)._chatRoomHandlers;
      }
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

  // Chọn ảnh
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAttachedImage(result.assets[0]);
    }
  };

  // Gửi tin nhắn
  const handleSend = useCallback(async () => {
    if ((!inputText.trim() && !attachedImage) || !socketRef.current) return;
    setSending(true);

    let finalImageUrl = undefined;
    let finalMessageType = 'TEXT';
    const currentAttachedImage = attachedImage;
    const currentText = inputText.trim();

    setAttachedImage(null);
    setInputText('');

    try {
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

      socketRef.current.emit('sendMessage', {
        conversationId: Number(id),
        content: currentText || (currentAttachedImage ? '[Hình ảnh]' : ''),
        messageType: finalMessageType,
        imageUrl: finalImageUrl,
      });
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
    } finally {
      setSending(false);
    }
  }, [inputText, id, attachedImage]);

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
    const isRecalled = Boolean(item.recalledAt);

    return (
      <View style={[styles.msgContainer, isMe ? styles.msgRight : styles.msgLeft]}>
        {!isMe && (
          <Avatar.Text
            size={28}
            label={customerName ? customerName.charAt(0).toUpperCase() : 'K'}
            style={{ marginRight: 8, marginBottom: 2 }}
          />
        )}
        <View style={{ flexShrink: 1 }}>
          {isAi && !isRecalled && (
            <View style={styles.aiLabel}>
              <MaterialCommunityIcons name="robot-outline" size={12} color={theme.colors.secondary} />
              <Text variant="labelSmall" style={{ color: theme.colors.secondary, marginLeft: 2 }}>AI</Text>
            </View>
          )}
          <View style={[
            styles.bubble,
            isRecalled
              ? { backgroundColor: theme.colors.surfaceVariant, opacity: 0.7, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.outlineVariant }
              : isMe
                ? { backgroundColor: theme.colors.primary }
                : isAi
                  ? { backgroundColor: `${theme.colors.secondary}15`, borderColor: `${theme.colors.secondary}30`, borderWidth: 1 }
                  : { backgroundColor: theme.colors.surfaceVariant },
          ]}>
            {item.imageUrl && !isRecalled && (
              <Pressable onPress={() => setViewingImage(item.imageUrl)}>
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={{ width: 220, height: 160, borderRadius: 12, marginBottom: item.content ? 8 : 4, backgroundColor: theme.colors.surfaceVariant }} 
                  resizeMode="cover" 
                />
              </Pressable>
            )}
            {item.content && (
              <Text 
                variant="bodyMedium" 
                style={[
                  { color: isMe && !isRecalled ? '#fff' : theme.colors.onSurface },
                  isRecalled && { fontStyle: 'italic', color: theme.colors.onSurfaceVariant }
                ]}
              >
                {item.content}
              </Text>
            )}
            <Text variant="labelSmall" style={[styles.time, { color: isMe && !isRecalled ? 'rgba(255,255,255,0.6)' : theme.colors.onSurfaceVariant }]}>
              {formatTime(item.createdAt)}
              {isMe && item.isRead && !isRecalled && ' ✓✓'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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

      {/* Service context banner — clickable */}
      {serviceName && (
        <TouchableRipple
          onPress={() => {
            if (serviceId) {
              // Provider app: navigate to service reviews page if available
              router.push({ pathname: '/service/[id]/reviews', params: { id: serviceId } } as any);
            }
          }}
          rippleColor={`${theme.colors.primary}20`}
          style={[styles.serviceBanner, { backgroundColor: `${theme.colors.primary}0A`, borderColor: `${theme.colors.primary}25` }]}
          accessibilityLabel={`Xem dịch vụ ${serviceName}`}
          accessibilityRole="link"
        >
          <View style={styles.serviceBannerContent}>
            <View style={[styles.serviceBannerIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
              <MaterialCommunityIcons name="wrench" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 9 }}>
                {contextType === 'booking' ? 'Đơn hàng theo dịch vụ' : 'Trao đổi về dịch vụ'}
              </Text>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                {serviceName}
              </Text>
            </View>
            {serviceId && (
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
            )}
          </View>
        </TouchableRipple>
      )}

      {/* Messages */}
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlashList
          ref={flashListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flashListRef.current?.scrollToEnd({ animated: true })}
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
                <MaterialCommunityIcons name="auto-fix" size={14} color={theme.colors.primary} />
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
                  {index === 0 && <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.colors.primary} />}
                  <Text variant="bodySmall" style={[styles.replyText, index === 0 && { color: theme.colors.primary }]}>
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
        {attachedImage && (
          <View style={styles.attachedImagePreview}>
            <Avatar.Image size={60} source={{ uri: attachedImage.uri }} style={{ borderRadius: 8 }} />
            <IconButton
              icon="close-circle"
              size={20}
              iconColor={theme.colors.error}
              style={styles.removeImageBtn}
              onPress={() => setAttachedImage(null)}
            />
          </View>
        )}
        <View style={styles.inputRow}>
          <IconButton icon="image-outline" iconColor={theme.colors.primary} size={24} onPress={pickImage} />
          <RNTextInput
            value={inputText}
            onChangeText={(text) => { setInputText(text); handleTyping(); }}
            placeholder="Nhập tin nhắn…"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={[
              styles.textInput, 
              { 
                color: theme.colors.onSurface,
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingTop: Platform.OS === 'ios' ? 10 : 8,
                paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                minHeight: 40,
                maxHeight: 120
              }
            ]}
            multiline
            maxLength={2000}
          />
          <IconButton
            icon="send"
            iconColor="#fff"
            containerColor={theme.colors.primary}
            size={20}
            onPress={handleSend}
            disabled={(!inputText.trim() && !attachedImage) || sending}
            style={styles.sendBtn}
            accessibilityLabel="Gửi tin nhắn"
          />
        </View>
      </View>

      <Modal visible={!!viewingImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseBtn} 
            onPress={() => setViewingImage(null)}
          >
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {viewingImage && (
            <Image 
              source={{ uri: viewingImage }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: insets.top > 0 ? insets.top + 8 : 16,
    paddingBottom: 10,
    paddingRight: 16,
    paddingLeft: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerTitle: {
    color: theme.colors.onSurface,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  serviceBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  serviceBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  serviceBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: { padding: 16, paddingBottom: 8 },
  msgContainer: { marginBottom: 8, maxWidth: '85%', flexDirection: 'row', alignItems: 'flex-end' },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, marginLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  time: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  typingBar: { paddingHorizontal: 20, paddingVertical: 4 },
  smartReplySection: {
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
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
    backgroundColor: `${theme.colors.primary}14`,
  },
  smartReplyTitle: {
    color: theme.colors.onSurface,
    fontWeight: '800',
  },
  smartReplyCount: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: '700',
  },
  replyRipple: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  replyChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyChipFeatured: {
    borderColor: `${theme.colors.primary}55`,
    backgroundColor: `${theme.colors.primary}0D`,
  },
  replyText: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: '700',
  },
  inputBar: {
    padding: 8,
    paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
    borderTopWidth: 1,
  },
  textInput: { flex: 1, maxHeight: 100 },
  sendBtn: { marginBottom: 4 },
  attachedImagePreview: {
    padding: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    marginBottom: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -4,
    left: 54,
    margin: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
