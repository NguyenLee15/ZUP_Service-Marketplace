import { useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Chip, Text, TextInput } from "react-native-paper";
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  LoadingState,
} from "../components/customer/customer-ui";
import { MessageBubble } from "../features/chatbot/components/ChatBubble";
import { Colors } from "../constants/colors";
import { chatApi } from "../features/chat/chat.api";
import { chatbotApi } from "../features/chatbot/chatbot.api";
import {
  getApiErrorMessage,
  normalizeList,
  unwrapData,
} from "../lib/api-response";
import { formatCurrency } from "../lib/format";
import { stableKey, toRouteId, routes } from "../lib/route-utils";

type ChatRole = "user" | "assistant";

type ChatbotQuickReply = {
  label?: string;
  message?: string;
};

type ChatbotCitation = {
  type?: "service" | "booking" | string;
  id?: number | string;
  label?: string;
  href?: string;
};

type ChatbotService = {
  id?: number | string;
  name?: string;
  description?: string;
  referencePrice?: number | string;
  providerId?: number | string;
  providerName?: string;
  avgRating?: number | string;
  totalReviews?: number | string;
  categoryName?: string;
  imageUrl?: string;
  distanceKm?: number | string;
  providerAddress?: string;
};

type ChatbotAction = {
  id?: string;
  type?: string;
  label?: string;
  summary?: string;
  payload?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  href?: string;
};

type NormalizedChatbotResponse = {
  reply: string;
  sessionId?: string;
  services: ChatbotService[];
  quickReplies: ChatbotQuickReply[];
  action?: ChatbotAction;
  citations: ChatbotCitation[];
  confidence?: number | string;
  needsAiStream?: boolean;
};

type ChatbotMessage = {
  id: string;
  role: ChatRole;
  content: string;
  services?: ChatbotService[];
  quickReplies?: ChatbotQuickReply[];
  action?: ChatbotAction;
  citations?: ChatbotCitation[];
  pending?: boolean;
};

const EMPTY_SUGGESTIONS: ChatbotQuickReply[] = [
  { label: "⚡ Tìm thợ sửa điện", message: "Tôi cần tìm thợ sửa điện gần nhà" },
  {
    label: "🧼 So sánh vệ sinh",
    message: "So sánh các dịch vụ vệ sinh nhà giúp tôi",
  },
  {
    label: "📦 Kiểm tra đơn hàng",
    message: "Kiểm tra tình trạng đơn hàng gần đây của tôi",
  },
  {
    label: "🔄 Đặt lại dịch vụ",
    message: "Tôi muốn đặt lại dịch vụ đã dùng trước đó",
  },
];

function normalizeChatbotResponse(payload: unknown): NormalizedChatbotResponse {
  const data: any = unwrapData(payload);
  return {
    reply:
      data?.reply ||
      data?.message ||
      data?.answer ||
      "Mình đã ghi nhận yêu cầu của bạn.",
    sessionId: data?.sessionId,
    services: Array.isArray(data?.services) ? data.services : [],
    quickReplies: Array.isArray(data?.quickReplies) ? data.quickReplies : [],
    action: data?.action,
    citations: Array.isArray(data?.citations) ? data.citations : [],
    confidence: data?.confidence,
    needsAiStream: Boolean(data?.needsAiStream),
  };
}

function normalizeHistoryMessages(payload: unknown): ChatbotMessage[] {
  const rows = normalizeList<any>(payload);
  return rows.map((item, index) => {
    const role = item.role === "assistant" ? "assistant" : "user";
    const metadata = item.metadata || {};
    return {
      id: String(item.id || `${role}-${index}`),
      role,
      content: item.content || "",
      services: metadata.services || item.services || [],
      quickReplies: metadata.quickReplies || item.quickReplies || [],
      action: metadata.action || item.action,
      citations: metadata.citations || item.citations || [],
    };
  });
}

function dedupeChatMessages(items: ChatbotMessage[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.id || `${item.role}-${item.content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getServiceImage(service: ChatbotService) {
  return service.imageUrl || null;
}

function getConversationId(payload: unknown) {
  const data: any = unwrapData(payload);
  return (
    data?.id ??
    data?.conversation?.id ??
    data?.data?.id ??
    data?.data?.conversation?.id
  );
}

function buildPageContext() {
  return {
    screen: "customer-mobile",
    path: "/chatbot",
  };
}

function getActionTarget(
  action?: ChatbotAction,
  citations?: ChatbotCitation[],
) {
  if (!action) return null;
  const payload = action.payload || {};
  const bookingId = Number(payload.bookingId || payload.id);
  const serviceId = Number(payload.serviceId);
  if (
    action.type === "VIEW_BOOKING" &&
    Number.isFinite(bookingId) &&
    bookingId > 0
  ) {
    return routes.booking.detail(String(bookingId));
  }
  if (
    Number.isFinite(serviceId) &&
    serviceId > 0 &&
    action.type === "OPEN_PROVIDER_CHAT"
  ) {
    return { serviceId };
  }
  const bookingCitation = citations?.find(
    (item) => item.type === "booking" && item.id,
  );
  if (bookingCitation?.id)
    return routes.booking.detail(String(bookingCitation.id));
  return (action.href as any) || null;
}

function messageFromResponse(
  response: NormalizedChatbotResponse,
): ChatbotMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: response.reply,
    services: response.services,
    quickReplies: response.quickReplies,
    action: response.action,
    citations: response.citations,
  };
}

export default function ChatbotScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const listRef = useRef<any>(null);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<ChatbotMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [chatLoadingServiceId, setChatLoadingServiceId] = useState<
    string | number | null
  >(null);
  const [titleInput, setTitleInput] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ["chatbot", "sessions"],
    queryFn: async () => normalizeList<any>(await chatbotApi.getSessions()),
    retry: 0,
  });

  const subtitle = loading
    ? "Đang trả lời..."
    : sessionId
      ? "Đang giữ ngữ cảnh cuộc trò chuyện"
      : "Gợi ý dịch vụ phù hợp nhu cầu";

  const currentSession = useMemo(
    () =>
      sessionsQuery.data?.find(
        (session) => String(session.id) === String(sessionId),
      ),
    [sessionId, sessionsQuery.data],
  );

  useEffect(() => {
    if (!sessionId) {
      setTitleInput("");
      return;
    }
    setTitleInput(
      String(
        currentSession?.title || currentSession?.summary || "Phiên trò chuyện",
      ),
    );
  }, [currentSession?.summary, currentSession?.title, sessionId]);

  const lastAssistantQuickReplies = useMemo(() => {
    const lastAssistant = [...items]
      .reverse()
      .find((item) => item.role === "assistant");
    return lastAssistant?.quickReplies || [];
  }, [items]);

  const quickReplies =
    items.length === 0 ? EMPTY_SUGGESTIONS : lastAssistantQuickReplies;

  const sendMessage = async (content: string, confirmedActionId?: string) => {
    const text = content.trim();
    if (!text && !confirmedActionId) return;

    setError("");
    setLoading(true);
    setLastUserMessage(text);
    if (text) {
      setItems((current) =>
        dedupeChatMessages([
          ...current,
          { id: `user-${Date.now()}`, role: "user", content: text },
        ]),
      );
      setMessage("");
    }

    try {
      const response = normalizeChatbotResponse(
        await chatbotApi.ask({
          message: text || "Xác nhận thao tác",
          sessionId,
          history: items
            .slice(-8)
            .map((item) => ({ role: item.role, content: item.content })),
          pageContext: buildPageContext(),
          confirmedActionId,
        }),
      );
      if (response.sessionId) setSessionId(response.sessionId);
      setItems((current) =>
        dedupeChatMessages([...current, messageFromResponse(response)]),
      );
      queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions"] });
      Haptics.selectionAsync().catch(() => {});
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể gọi trợ lý AI."));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    } finally {
      setLoading(false);
      setActionLoadingId(null);
    }
  };

  const retryLast = () => {
    if (lastUserMessage) sendMessage(lastUserMessage);
  };

  const loadSession = async (nextSessionId: string) => {
    setError("");
    setLoading(true);
    try {
      const history = normalizeHistoryMessages(
        await chatbotApi.getSessionMessages(nextSessionId),
      );
      setSessionId(nextSessionId);
      setItems(history);
      Haptics.selectionAsync().catch(() => {});
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải phiên trò chuyện."));
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (targetSessionId: string) => {
    try {
      await chatbotApi.deleteSession(targetSessionId);
      if (targetSessionId === sessionId) {
        setSessionId(undefined);
        setItems([]);
      }
      queryClient.invalidateQueries({ queryKey: ["chatbot", "sessions"] });
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể xóa phiên trò chuyện."));
    }
  };

  const saveSessionTitle = async () => {
    if (!sessionId) return;
    const title = titleInput.trim().slice(0, 120);
    if (!title) {
      setError("Tên phiên trò chuyện không được để trống.");
      return;
    }
    setTitleSaving(true);
    setError("");
    try {
      await chatbotApi.updateSessionTitle(sessionId, title);
      await queryClient.invalidateQueries({
        queryKey: ["chatbot", "sessions"],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể đổi tên phiên trò chuyện."));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    } finally {
      setTitleSaving(false);
    }
  };

  const openServiceChat = async (service: ChatbotService) => {
    const serviceId = Number(service.id);
    if (!Number.isFinite(serviceId) || serviceId <= 0) return;
    setChatLoadingServiceId(service.id || serviceId);
    try {
      const response = await chatApi.getOrCreateConversation({ serviceId });
      const conversationId = getConversationId(response);
      if (!conversationId) throw new Error("Missing conversation id");
      router.push(
        routes.chatRoom(conversationId, service.providerName || "Nhà cung cấp"),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể mở tin nhắn."));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    } finally {
      setChatLoadingServiceId(null);
    }
  };

  const handleAction = async (
    action: ChatbotAction,
    citations?: ChatbotCitation[],
  ) => {
    const target = getActionTarget(action, citations) as any;
    if (target && !target.serviceId && !action.requiresConfirmation) {
      router.push(target);
      return;
    }
    if (target && target.serviceId && !action.requiresConfirmation) {
      await openServiceChat({ id: target.serviceId });
      return;
    }
    if (!action.id) return;
    setActionLoadingId(action.id);
    await sendMessage(action.label || "Xác nhận", action.id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
    >
      <FlashList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <CustomerHeader title="AI tư vấn" subtitle={subtitle} />
            {sessionsQuery.data?.length ? (
              <SessionStrip
                sessions={sessionsQuery.data}
                currentSessionId={sessionId}
                onSelect={loadSession}
                onDelete={deleteSession}
              />
            ) : null}
            {sessionId ? (
              <CustomerCard>
                <View style={styles.renameBox}>
                  <TextInput
                    label="Tên phiên chat"
                    mode="outlined"
                    dense
                    value={titleInput}
                    onChangeText={(value) => setTitleInput(value.slice(0, 120))}
                    maxLength={120}
                    style={styles.renameInput}
                  />
                  <Button
                    mode="contained"
                    compact
                    loading={titleSaving}
                    disabled={titleSaving || !titleInput.trim()}
                    onPress={saveSessionTitle}
                    style={styles.renameButton}
                  >
                    Lưu
                  </Button>
                </View>
              </CustomerCard>
            ) : null}
            {error ? (
              <View style={styles.errorBlock}>
                <InlineMessage tone="error" message={error} />
                {lastUserMessage ? (
                  <Button
                    mode="outlined"
                    icon="refresh"
                    onPress={retryLast}
                    style={styles.roundedButton}
                  >
                    Thử lại
                  </Button>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="robot-outline"
              title="Bạn cần hỗ trợ gì?"
              description="Mô tả nhu cầu, AI sẽ gợi ý dịch vụ và hỗ trợ đặt lịch."
            />
          ) : null
        }
        ListFooterComponent={
          loading ? <LoadingBubble /> : <View style={{ height: 8 }} />
        }
        renderItem={({ item }) => (
          <MessageBubble
            item={item}
            chatLoadingServiceId={chatLoadingServiceId}
            actionLoadingId={actionLoadingId}
            onOpenService={(service) => {
              const serviceId = toRouteId(service.id);
              if (!serviceId) return;
              router.push(routes.service(serviceId));
            }}
            onBookService={(service) => {
              const serviceId = toRouteId(service.id);
              if (!serviceId) return;
              router.push(routes.booking.create(serviceId));
            }}
            onChatService={openServiceChat}
            onAction={handleAction}
          />
        )}
      />

      <View style={styles.inputShell}>
        {quickReplies.length > 0 ? (
          <View style={styles.quickReplyRow}>
            {quickReplies.slice(0, 4).map((reply, index) => (
              <Chip
                key={`${reply.label || reply.message}-${index}`}
                mode="outlined"
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  sendMessage(reply.message || reply.label || "");
                }}
                style={styles.quickReplyChip}
              >
                {reply.label || reply.message}
              </Chip>
            ))}
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            mode="outlined"
            label="Bạn cần hỗ trợ gì?"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={1}
            maxLength={1200}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi cho AI"
            disabled={!message.trim() || loading}
            onPress={() => sendMessage(message)}
            style={[
              styles.sendButton,
              !message.trim() || loading ? styles.sendButtonDisabled : null,
            ]}
          >
            <MaterialCommunityIcons name="send" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function SessionStrip({
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
}: {
  sessions: any[];
  currentSessionId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.sessionRow}>
      {sessions.slice(0, 4).map((session) => (
        <Chip
          key={session.id}
          selected={session.id === currentSessionId}
          onPress={() => onSelect(String(session.id))}
          onClose={() => onDelete(String(session.id))}
          style={styles.sessionChip}
        >
          {session.title || session.summary || "Phiên gần đây"}
        </Chip>
      ))}
    </View>
  );
}

// MessageBubble, ChatbotServiceCard and ActionCard are imported from '../features/chatbot/components/ChatBubble'

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 200);
    const a3 = animateDot(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingIndicatorRow}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
  );
}

function LoadingBubble() {
  return (
    <View style={styles.messageWrap}>
      <View style={styles.aiMessageHeader}>
        <View style={styles.aiAvatar}>
          <MaterialCommunityIcons name="robot" size={16} color="#FFF" />
        </View>
        <CustomerCard
          style={[
            styles.bubble,
            styles.assistantBubble,
            { paddingVertical: 12 },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TypingIndicator />
            <Text
              variant="labelSmall"
              style={{ color: Colors.light.textSecondary }}
            >
              Trợ lý đang phân tích...
            </Text>
          </View>
        </CustomerCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  listContent: { padding: 16, paddingBottom: 20 },
  headerWrap: { gap: 12, marginBottom: 12 },
  errorBlock: { gap: 10 },
  sessionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sessionChip: { maxWidth: "48%", borderRadius: 999 },
  messageWrap: { marginBottom: 10 },
  bubble: { maxWidth: "94%" },
  userBubble: { backgroundColor: Colors.light.primarySoft },
  assistantBubble: {
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
    borderWidth: 1,
  },
  // Typing indicator and AI Avatar
  typingIndicatorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  aiMessageHeader: { flexDirection: "row", gap: 8, alignItems: "center" },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#059669", // Emerald dark
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: { color: Colors.light.text, lineHeight: 22 },
  embeddedCards: { gap: 10, marginTop: 12 },
  serviceCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  serviceBody: { flexDirection: "row", gap: 10 },
  serviceImage: {
    width: 78,
    height: 78,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceVariant,
  },
  imageFallback: {
    width: 78,
    height: 78,
    borderRadius: 12,
    backgroundColor: Colors.light.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceInfo: { flex: 1, gap: 4 },
  serviceTitle: { color: Colors.light.text, fontWeight: "900" },
  subtitle: { color: Colors.light.textSecondary, lineHeight: 19 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: Colors.light.textSecondary, fontWeight: "800" },
  priceText: { color: Colors.light.primary, fontWeight: "900" },
  actionRow: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1, borderRadius: 10 },
  actionCard: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}33`,
    backgroundColor: Colors.light.primarySoft,
    borderRadius: 14,
    gap: 8,
  },
  actionTitle: { color: Colors.light.text, fontWeight: "900" },
  inputShell: {
    padding: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
  },
  quickReplyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  quickReplyChip: { borderRadius: 999 },
  renameBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  renameInput: { flex: 1 },
  renameButton: { borderRadius: 12 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, maxHeight: 120 },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: { backgroundColor: Colors.light.borderStrong },
  roundedButton: { borderRadius: 12 },
});
