import { useActiveColors } from '../../../hooks/useActiveColors';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Button, Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { formatCurrency } from '../../../lib/format';

const getStyles = (activeColors: any) => StyleSheet.create({
  messageWrap: { marginBottom: 12 },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  userBubble: {
    backgroundColor: activeColors.primarySoft,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: activeColors.successBg,
    borderColor: activeColors.success,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: { color: activeColors.text, lineHeight: 22 },
  embeddedCards: { gap: 10, marginTop: 12 },
  serviceCard: {
    borderWidth: 1,
    borderColor: activeColors.border,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    backgroundColor: activeColors.surface,
    shadowColor: activeColors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceBody: { flexDirection: 'row', gap: 12 },
  serviceImage: { width: 84, height: 84, borderRadius: 12, backgroundColor: activeColors.surfaceVariant },
  imageFallback: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: activeColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: { flex: 1, gap: 4 },
  serviceTitle: { color: activeColors.text, fontWeight: '900', fontSize: 14 },
  subtitle: { color: activeColors.textSecondary, lineHeight: 18, fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: activeColors.textSecondary, fontWeight: '800' },
  priceText: { color: activeColors.primary, fontWeight: '900', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionButton: { flex: 1, borderRadius: 10 },
  actionCard: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: `${activeColors.primary}25`,
    borderStyle: 'dashed',
    backgroundColor: activeColors.primarySoft,
    borderRadius: 16,
    gap: 8,
  },
  actionTitle: { color: activeColors.text, fontWeight: '900', fontSize: 14 },
  roundedButton: { borderRadius: 12, height: 40 },
  card: {
    backgroundColor: activeColors.surface,
    borderColor: activeColors.border,
    borderWidth: 0,
  },
  cardContent: { padding: 12 },
  // AI and User layouts
  mineRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  aiRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', maxWidth: '100%' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669', // Emerald dark
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${activeColors.warning}18`,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingBadgeText: { color: '#D97706', fontSize: 11, fontWeight: '800' },
  reviewCountText: { color: activeColors.textSecondary, fontSize: 12 },
});

type ChatRole = 'user' | 'assistant';

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
};

type ChatbotAction = {
  id?: string;
  type?: string;
  label?: string;
  summary?: string;
  payload?: Record<string, unknown>;
  requiresConfirmation?: boolean;
};

type ChatbotCitation = {
  type?: 'service' | 'booking' | string;
  id?: number | string;
  label?: string;
};

type ChatbotMessage = {
  id: string;
  role: ChatRole;
  content: string;
  services?: ChatbotService[];
  quickReplies?: Array<{ label?: string; message?: string }>;
  action?: ChatbotAction;
  citations?: ChatbotCitation[];
};

export function ChatbotServiceCard({
  service,
  chatLoading,
  onOpen,
  onBook,
  onChat,
}: {
  service: ChatbotService;
  chatLoading: boolean;
  onOpen: () => void;
  onBook: () => void;
  onChat: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const imageUrl = service.imageUrl || null;
  return (
    <View style={styles.serviceCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở dịch vụ ${service.name || 'dịch vụ'}`}
        accessibilityHint="Xem chi tiết dịch vụ AI đề xuất"
        onPress={onOpen}
        style={styles.serviceBody}
        hitSlop={6}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.serviceImage} contentFit="cover" transition={160} />
        ) : (
          <View style={styles.imageFallback}>
            <MaterialCommunityIcons name="tools" size={24} color={activeColors.primary} />
          </View>
        )}
        <View style={styles.serviceInfo}>
          <Text variant="titleSmall" style={styles.serviceTitle} numberOfLines={2}>
            {service.name || 'Dịch vụ'}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
            {service.providerName || service.categoryName || 'Zup'}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
              <Text variant="labelSmall" style={styles.ratingBadgeText}>
                {Number(service.avgRating || 0).toFixed(1)}
              </Text>
            </View>
            <Text style={styles.reviewCountText}>
              ({service.totalReviews || 0} đánh giá)
            </Text>
          </View>
          <Text variant="titleSmall" style={styles.priceText}>
            {formatCurrency(service.referencePrice)}
          </Text>
          {service.distanceKm ? (
            <Text variant="labelSmall" style={styles.subtitle}>
              Khoảng cách {Number(service.distanceKm).toFixed(1)} km
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actionRow}>
        <Button mode="outlined" compact onPress={onOpen} style={styles.actionButton} accessibilityLabel={`Xem dịch vụ ${service.name || ''}`}>
          Xem
        </Button>
        <Button
          mode="outlined"
          compact
          loading={chatLoading}
          disabled={chatLoading}
          onPress={onChat}
          style={styles.actionButton}
          accessibilityLabel={`Nhắn tin về dịch vụ ${service.name || ''}`}
        >
          Nhắn tin
        </Button>
        <Button mode="contained" compact onPress={onBook} style={styles.actionButton} accessibilityLabel={`Đặt lịch dịch vụ ${service.name || ''}`}>
          Đặt lịch
        </Button>
      </View>
    </View>
  );
}

export function ActionCard({
  action,
  loading,
  onPress,
}: {
  action: ChatbotAction;
  loading: boolean;
  onPress: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.actionCard}>
      <Text variant="titleSmall" style={styles.actionTitle}>
        {action.label || 'Xác nhận thao tác'}
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {action.summary || 'AI cần bạn xác nhận trước khi tiếp tục.'}
      </Text>
      <Button
        mode="contained"
        loading={loading}
        disabled={loading}
        onPress={onPress}
        style={styles.roundedButton}
        accessibilityLabel={action.requiresConfirmation ? 'Xác nhận thao tác AI' : 'Mở thao tác AI'}
      >
        {action.requiresConfirmation ? 'Xác nhận' : 'Mở'}
      </Button>
    </View>
  );
}

export function MessageBubble({
  item,
  chatLoadingServiceId,
  actionLoadingId,
  onOpenService,
  onBookService,
  onChatService,
  onAction,
}: {
  item: ChatbotMessage;
  chatLoadingServiceId: string | number | null;
  actionLoadingId: string | null;
  onOpenService: (service: ChatbotService) => void;
  onBookService: (service: ChatbotService) => void;
  onChatService: (service: ChatbotService) => void;
  onAction: (action: ChatbotAction, citations?: ChatbotCitation[]) => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const mine = item.role === 'user';
  return (
    <View style={[styles.messageWrap, { alignItems: mine ? 'flex-end' : 'flex-start' }]}>
      <View style={mine ? styles.mineRow : styles.aiRow}>
        {!mine ? (
          <View style={styles.aiAvatar}>
            <MaterialCommunityIcons name="robot" size={16} color="#FFF" />
          </View>
        ) : null}

        <Card style={[styles.card, styles.bubble, mine ? styles.userBubble : styles.assistantBubble]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium" style={styles.messageText}>
              {item.content}
            </Text>
            {item.services?.length ? (
              <View style={styles.embeddedCards}>
                {item.services.map((service, index) => (
                  <ChatbotServiceCard
                    key={`${service.id || 'chatbot-service'}-${index}`}
                    service={service}
                    chatLoading={String(chatLoadingServiceId || '') === String(service.id || '')}
                    onOpen={() => onOpenService(service)}
                    onBook={() => onBookService(service)}
                    onChat={() => onChatService(service)}
                  />
                ))}
              </View>
            ) : null}
            {item.action ? (
              <ActionCard
                action={item.action}
                loading={actionLoadingId === item.action.id}
                onPress={() => onAction(item.action!, item.citations)}
              />
            ) : null}
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}
