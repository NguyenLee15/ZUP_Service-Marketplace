/**
 * Service Form - create or edit provider service.
 */
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Modal, Portal, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { serviceApi } from '../../features/service/service.api';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderSectionHeader,
} from '../../components/provider/provider-ui';

type MessageState = {
  tone: 'success' | 'warning' | 'error' | 'info';
  text: string;
} | null;

export default function ServiceFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id, serviceData } = useLocalSearchParams<{ id?: string; serviceData?: string }>();

  const isEditing = Boolean(id);

  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await serviceApi.getCategories();
        setCategories(res.data?.data || []);
      } catch {
        setMessage({ tone: 'error', text: 'Không tải được danh mục dịch vụ.' });
      }
    };
    fetchCategories();

    if (isEditing && serviceData) {
      try {
        const data = JSON.parse(serviceData);
        setName(data.name || '');
        setDescription(data.description || '');
        setBasePrice(String(data.basePrice || data.referencePrice || ''));
        if (data.category) setSelectedCategory(data.category);
      } catch {
        setMessage({ tone: 'warning', text: 'Không đọc được dữ liệu dịch vụ hiện tại.' });
      }
    }
  }, [isEditing, serviceData]);

  const pickImages = async () => {
    if (images.length >= 5) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: Math.max(1, 5 - images.length),
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets].slice(0, 5));
      setMessage(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!selectedCategory) return 'Vui lòng chọn danh mục dịch vụ.';
    if (!name.trim()) return 'Vui lòng nhập tên dịch vụ.';
    if (!basePrice.replace(/[^0-9]/g, '')) return 'Vui lòng nhập giá tham khảo.';
    if (!description.trim()) return 'Vui lòng nhập mô tả dịch vụ.';
    return '';
  };

  const handleSubmit = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      setMessage({ tone: 'warning', text: validationMessage });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('categoryId', String(selectedCategory.id));
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('referencePrice', basePrice.replace(/[^0-9]/g, ''));

      images.forEach((img, index) => {
        formData.append('images', { uri: img.uri, name: `service_${index}.jpg`, type: 'image/jpeg' } as any);
      });

      if (isEditing) await serviceApi.updateService(Number(id), formData);
      else await serviceApi.createService(formData);

      router.back();
    } catch (err: any) {
      setMessage({
        tone: 'error',
        text: err?.response?.data?.error?.message || 'Có lỗi xảy ra khi lưu dịch vụ.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ProviderPageHeader
          title={isEditing ? 'Sửa dịch vụ' : 'Tạo dịch vụ'}
          subtitle="Điền thông tin rõ ràng để khách dễ hiểu phạm vi và giá dự kiến."
          action={<IconButton icon="arrow-left" mode="contained-tonal" onPress={() => router.back()} accessibilityLabel="Quay lại" />}
        />

        {message && <ProviderInlineMessage tone={message.tone} message={message.text} />}

        <ProviderCard contentStyle={styles.section}>
          <ProviderSectionHeader title="Danh mục" />
          <Button
            mode="outlined"
            onPress={() => setShowCategoryModal(true)}
            style={styles.categoryButton}
            contentStyle={styles.categoryButtonContent}
            icon="shape-outline"
            accessibilityLabel="Chọn danh mục dịch vụ"
          >
            {selectedCategory ? selectedCategory.name : 'Chọn danh mục'}
          </Button>
        </ProviderCard>

        <ProviderCard contentStyle={styles.section}>
          <ProviderSectionHeader title="Thông tin dịch vụ" />
          <TextInput
            label="Tên dịch vụ"
            value={name}
            onChangeText={value => {
              setName(value);
              setMessage(null);
            }}
            mode="outlined"
            style={styles.input}
            accessibilityLabel="Tên dịch vụ"
          />
          <TextInput
            label="Mô tả dịch vụ"
            value={description}
            onChangeText={value => {
              setDescription(value);
              setMessage(null);
            }}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.input}
            accessibilityLabel="Mô tả dịch vụ"
          />
        </ProviderCard>

        <ProviderCard contentStyle={styles.section}>
          <ProviderSectionHeader title="Giá" />
          <TextInput
            label="Giá tham khảo (VNĐ)"
            value={basePrice}
            onChangeText={value => {
              setBasePrice(value);
              setMessage(null);
            }}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Icon icon="cash" accessibilityLabel="Giá tham khảo" />}
            style={styles.input}
            accessibilityLabel="Giá tham khảo"
          />
          <Text variant="bodySmall" style={styles.helperText}>
            Giá này giúp khách ước tính chi phí. Bạn vẫn có thể báo giá cụ thể trong từng đơn.
          </Text>
        </ProviderCard>

        <ProviderCard contentStyle={styles.section}>
          <ProviderSectionHeader title={`Ảnh dịch vụ (${images.length}/5)`} />
          <Text variant="bodySmall" style={styles.helperText}>
            Ảnh thật giúp khách hiểu chất lượng công việc. Tối đa 5 ảnh.
          </Text>

          <View style={styles.imageGrid}>
            {images.map((img, index) => (
              <View key={`${img.uri}-${index}`} style={styles.imageTile}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <IconButton
                  icon="close"
                  size={18}
                  mode="contained"
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  accessibilityLabel={`Xóa ảnh ${index + 1}`}
                />
              </View>
            ))}
            {images.length < 5 && (
              <Button mode="outlined" icon="camera-plus" onPress={pickImages} style={styles.addImageButton}>
                Thêm ảnh
              </Button>
            )}
          </View>
        </ProviderCard>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
          contentStyle={styles.submitContent}
        >
          {submitting ? 'Đang xử lý…' : isEditing ? 'Lưu thay đổi' : 'Tạo dịch vụ'}
        </Button>
      </ScrollView>

      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Chọn danh mục
          </Text>
          <ScrollView style={styles.categoryList}>
            {categories.map((cat: any) => (
              <RadioButton.Item
                key={cat.id}
                label={cat.name}
                value={String(cat.id)}
                status={selectedCategory?.id === cat.id ? 'checked' : 'unchecked'}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowCategoryModal(false);
                  setMessage(null);
                }}
                color={theme.colors.primary}
                labelStyle={styles.radioLabel}
              />
            ))}
            {categories.length === 0 && (
              <Text variant="bodySmall" style={styles.emptyCategory}>
                Chưa tải được danh mục.
              </Text>
            )}
          </ScrollView>
          <Button mode="text" onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
            Đóng
          </Button>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  section: {
    gap: 12,
  },
  input: {
    backgroundColor: Colors.light.surface,
  },
  categoryButton: {
    borderRadius: 12,
    borderColor: Colors.light.borderStrong,
  },
  categoryButtonContent: {
    justifyContent: 'flex-start',
    minHeight: 48,
  },
  helperText: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageTile: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceVariant,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    margin: 0,
    backgroundColor: 'rgba(5,5,5,0.58)',
  },
  addImageButton: {
    minHeight: 48,
    alignSelf: 'center',
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitContent: {
    height: 50,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 18,
  },
  modalTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    marginBottom: 10,
  },
  categoryList: {
    maxHeight: 320,
  },
  radioLabel: {
    color: Colors.light.text,
  },
  emptyCategory: {
    color: Colors.light.textSecondary,
    padding: 12,
  },
  closeButton: {
    marginTop: 8,
  },
});
