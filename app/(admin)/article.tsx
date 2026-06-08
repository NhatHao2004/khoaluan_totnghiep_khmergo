import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { db } from '../../utils/firebaseConfig';

const { width } = Dimensions.get('window');

const ArticleManagement = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [titleKm, setTitleKm] = useState('');
  const [category, setCategory] = useState('Tin tức');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Delete Confirm State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message: msg, type });
    Animated.spring(translateY, {
      toValue: 40,
      useNativeDriver: true,
      friction: 8,
    }).start();

    setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast({ ...toast, visible: false }));
    }, 3000);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh');
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        setImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !imageUrl.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và chọn ảnh');
      return;
    }
    try {
      const id = editingArticle ? editingArticle.id : `art_${Date.now()}`;
      const data = {
        title,
        titleKm,
        category,
        summary,
        content,
        imageUrl,
        updatedAt: serverTimestamp(),
        createdAt: editingArticle ? editingArticle.createdAt : serverTimestamp(),
      };
      await setDoc(doc(db, 'articles', id), data);
      setModalVisible(false);
      resetForm();
      showToast(editingArticle ? 'Đã cập nhật bài viết' : 'Đã thêm bài viết mới');
    } catch (e) {
      showToast('Lỗi khi lưu bài viết', 'error');
    }
  };

  const resetForm = () => {
    setEditingArticle(null);
    setTitle('');
    setTitleKm('');
    setCategory('Tin tức');
    setSummary('');
    setContent('');
    setImageUrl('');
  };

  const handleDelete = (article: any) => {
    setPendingDelete(article);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      // Move to Trash logic
      await setDoc(doc(db, 'system_trash', pendingDelete.id), {
        ...pendingDelete,
        deletedAt: serverTimestamp(),
        type: 'article'
      });
      await deleteDoc(doc(db, 'articles', pendingDelete.id));
      setDeleteConfirmVisible(false);
      showToast('Đã chuyển bài viết vào thùng rác');
    } catch (e) {
      showToast('Lỗi khi xóa bài viết', 'error');
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderArticleItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <Text style={styles.cardDate}>
            {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Hôm nay'}
          </Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
        
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => {
              setEditingArticle(item);
              setTitle(item.title);
              setTitleKm(item.titleKm || '');
              setCategory(item.category);
              setSummary(item.summary);
              setContent(item.content);
              setImageUrl(item.imageUrl);
              setModalVisible(true);
            }}
          >
            <Ionicons name="pencil" size={18} color="#3b82f6" />
            <Text style={styles.editBtnText}>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý bài viết</Text>
        <TouchableOpacity 
          style={styles.addBtnHeader}
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Ionicons name="add" size={28} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={item => item.id}
          renderItem={renderArticleItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
            </View>
          }
        />
      )}

      {/* Article Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalBg}>
          <View style={styles.modalContentFull}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingArticle ? 'Sửa bài viết' : 'Thêm bài viết mới'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={30} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tiêu đề (Tiếng Việt)</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề..." />

              <Text style={styles.inputLabel}>Tiêu đề (Tiếng Khmer)</Text>
              <TextInput style={styles.input} value={titleKm} onChangeText={setTitleKm} placeholder="Nhập tiêu đề Khmer..." />

              <Text style={styles.inputLabel}>Danh mục</Text>
              <View style={styles.catRow}>
                {['Tin tức', 'Sự kiện', 'Văn hóa', 'Lịch sử'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, category === cat && styles.activeCatBtn]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catBtnText, category === cat && styles.activeCatBtnText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Ảnh bài viết</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.pickedImagePreview} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#94a3b8" />
                    <Text style={styles.imagePickerText}>Nhấn để chọn ảnh</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Mô tả ngắn</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                value={summary} 
                onChangeText={setSummary} 
                multiline 
                placeholder="Tóm tắt nội dung bài viết..." 
              />

              <Text style={styles.inputLabel}>Nội dung bài viết</Text>
              <TextInput 
                style={[styles.input, { height: 250, textAlignVertical: 'top' }]} 
                value={content} 
                onChangeText={setContent} 
                multiline 
                placeholder="Nhập nội dung chi tiết..." 
              />
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Lưu bài viết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="trash" size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Xác nhận xóa?</Text>
            <Text style={styles.confirmSubText}>Bài viết "{pendingDelete?.title}" sẽ được chuyển vào thùng rác.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: '#f1f5f9' }]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: '#64748b' }]}>Bỏ qua</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnSmall} onPress={confirmDelete}>
                <Text style={styles.saveBtnText}>Xác nhận xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast.visible && (
        <Animated.View style={[
          styles.toastContainer,
          { transform: [{ translateY }] },
          toast.type === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Ionicons name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"} size={24} color="#fff" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfd' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 45, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  addBtnHeader: { width: 44, height: 44, backgroundColor: '#f0f9ff', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  searchSection: { padding: 16, backgroundColor: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardCategory: { backgroundColor: '#eff6ff', color: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8, lineHeight: 24 },
  cardSummary: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 18 },
  
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#3b82f6' },
  deleteBtn: { width: 40, height: 40, backgroundColor: '#fff1f2', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94a3b8', fontWeight: '600' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentFull: { width: '100%', height: '100%', backgroundColor: '#fff', padding: 20, paddingTop: 45 },
  modalContentSmall: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  modalForm: { flex: 1 },
  
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 15, fontSize: 16, color: '#1e293b' },
  
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeCatBtn: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  catBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeCatBtnText: { color: '#fff' },
  
  imagePickerBtn: { width: '100%', height: 200, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', overflow: 'hidden', marginTop: 5 },
  imagePickerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePickerText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  pickedImagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 25 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff' },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
  saveBtnSmall: { flex: 1.5, backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  confirmIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmSubText: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginTop: 10 },

  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, zIndex: 9999, gap: 12, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
});

export default ArticleManagement;
