import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc } from 'firebase/firestore';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../utils/firebaseConfig';
import { ms, s, vs } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Memoized Components ---

const DestItem = memo(({ item, onEdit, onDelete, onPreview }: any) => (
  <View style={styles.card}>
    <Image source={item.imageUrl} style={styles.cardImage} contentFit="cover" transition={300} />
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}><Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{item.name}</Text></View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.viewBtn} onPress={() => onPreview(item)}>
          <Ionicons name="eye-outline" size={ms(18)} color="#3b82f6" />
          <Text style={styles.viewBtnText} numberOfLines={1} adjustsFontSizeToFit>Xem chi tiết</Text>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
            <Ionicons name="create-outline" size={ms(18)} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name)}>
            <Ionicons name="trash-outline" size={ms(18)} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
));

const VocabItem = memo(({ item, onManage, onEdit, onDelete, getImageSource }: any) => {
  const fallback = useMemo(() => {
    if (item.title === 'cat_family' || item.id === 'family') return require('@/assets/images/giadinh.jpg');
    if (item.title === 'cat_food' || item.id === 'food') return require('@/assets/images/monan.jpg');
    if (item.title === 'cat_greetings' || item.id === 'greetings') return require('@/assets/images/chaohoi.jpg');
    if (item.title === 'cat_numbers' || item.id === 'numbers') return require('@/assets/images/sodem.jpg');
    return require('@/assets/images/giadinh.jpg');
  }, [item.title, item.id]);

  return (
    <View style={styles.vocabPremiumCard}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onManage(item.id)} style={styles.vocabPreviewTab}>
        <View style={styles.vocabLargeImageContainer}>
          <Image
            source={getImageSource(item.imageUrl, fallback)}
            style={styles.vocabLargeImage}
            contentFit="contain"
            transition={300}
          />
        </View>

        <View style={styles.vocabCardFooter}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vocabLargeTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {item.title === 'cat_family' ? 'Gia đình thân yêu' :
                item.title === 'cat_food' ? 'Ẩm thực đặc sắc' :
                  item.title === 'cat_greetings' ? 'Chào hỏi thông dụng' :
                    item.title === 'cat_numbers' ? 'Số đếm cơ bản' :
                      item.title}
            </Text>
          </View>
          <View style={styles.footerActionGroup}>
            <TouchableOpacity style={styles.footerActionBtn} onPress={() => onEdit(item)}>
              <Ionicons name="pencil" size={ms(18)} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerActionBtn, { borderColor: '#fee2e2' }]} onPress={() => onDelete(item)}>
              <Ionicons name="trash-outline" size={ms(18)} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const WordItem = memo(({ word, onEdit, onDelete }: any) => (
  <View style={styles.premiumWordItem}>
    <View style={styles.wordMainContent}>
      <Text style={styles.wordKhmText}>{word.khm}</Text>
      <Text style={[styles.pronText, { marginTop: vs(4) }]}>{word.pronunciation}</Text>
      <Text style={[styles.wordVieText, { color: '#3b82f6', marginTop: vs(4) }]}>{word.life || word.vie}</Text>
    </View>

    <View style={styles.wordActionGroup}>
      <TouchableOpacity onPress={() => onEdit(word)} style={styles.miniActionBtn}>
        <Ionicons name="pencil" size={ms(14)} color="#3b82f6" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(word)} style={[styles.miniActionBtn, { borderColor: '#fee2e2' }]}>
        <Ionicons name="trash-outline" size={ms(14)} color="#ef4444" />
      </TouchableOpacity>
    </View>
  </View>
));

const ContentManagement = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'destinations' | 'vocabulary'>('destinations');
  const [destinations, setDestinations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastY = useSharedValue(-120);

  const triggerToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    toastY.value = withSpring(Platform.OS === 'ios' ? 50 : 40, {
      damping: 15,
      stiffness: 120,
    });

    setTimeout(() => {
      toastY.value = withTiming(-120, { duration: 400 });
      setTimeout(() => setShowToast(false), 400);
    }, 3000);
  }, []);

  const animatedToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: interpolate(toastY.value, [-100, 40], [0, 1], 'clamp'),
  }));

  const getImageSource = useCallback((uri: string, fallback: any = { uri: 'https://via.placeholder.com/150' }) => {
    if (uri && (uri.startsWith('http') || uri.startsWith('data:'))) {
      return { uri };
    }
    const pagodaImages: any = {
      'pagoda_1': require('@/assets/images/chuaang.jpg'),
      'pagoda_2': require('@/assets/images/chuahang.jpg'),
      'pagoda_3': require('@/assets/images/kampong.jpg'),
      'pagoda_4': require('@/assets/images/salengcu.jpg'),
      'pagoda_5': require('@/assets/images/veluvana.jpg'),
    };
    return pagodaImages[uri] || fallback;
  }, []);

  const pickImage = async (onSelected: (val: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh để sử dụng tính năng này');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        onSelected(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      triggerToast('Không thể chọn ảnh', 'error');
    }
  };

  const ImageSelector = ({ value, onChange, label, style }: { value: string, onChange: (val: string) => void, label: string, style?: any }) => (
    <View style={[{ marginBottom: vs(15) }, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.imagePickerBtn}
        onPress={() => pickImage(onChange)}
      >
        {value ? (
          <View style={{ width: '100%', height: '100%' }}>
            <Image source={getImageSource(value)} style={styles.pickedImagePreview} contentFit="cover" />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              <Ionicons name="close-circle" size={ms(24)} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerPlaceholder}>
            <Ionicons name="image-outline" size={ms(32)} color="#94a3b8" />
            <Text style={styles.imagePickerText}>Nhấn để chọn ảnh</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
  const [dBlocks, setDBlocks] = useState<any[]>([]);

  // Destination Form State
  const [destModalVisible, setDestModalVisible] = useState(false);
  const [editingDest, setEditingDest] = useState<any>(null);
  const [dName, setDName] = useState('');
  const [dNameKm, setDNameKm] = useState('');
  const [dLoc, setDLoc] = useState('');
  const [dLocKm, setDLocKm] = useState('');
  const [dDesc, setDDesc] = useState('');
  const [dDescKm, setDDescKm] = useState('');
  const [dImg, setDImg] = useState('');
  const [dImg1, setDImg1] = useState('');
  const [dImg2, setDImg2] = useState('');
  const [dImg3, setDImg3] = useState('');
  const [dImg4, setDImg4] = useState('');
  const [dImg5, setDImg5] = useState('');
  const [dImg6, setDImg6] = useState('');
  const [dCat, setDCat] = useState<'pagoda' | 'culture' | 'food'>('pagoda');
  const [dLat, setDLat] = useState('');
  const [dLng, setDLng] = useState('');

  // Delete Confirm Modal State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'topic' | 'word' | 'destination'>('topic');

  // Vocabulary Form State
  const [topicModalVisible, setTopicModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicTitleKm, setTopicTitleKm] = useState('');
  const [topicImg, setTopicImg] = useState('');

  const [wordModalVisible, setWordModalVisible] = useState(false);
  const [managingTopicId, setManagingTopicId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [wordKhm, setWordKhm] = useState('');
  const [wordVie, setWordVie] = useState('');
  const [wordPron, setWordPron] = useState('');
  const [wordImg, setWordImg] = useState('');
  const [vocabSearchQuery, setVocabSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const qDest = query(collection(db, 'destinations'));
    const unsubDest = onSnapshot(qDest, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = data.sort((a: any, b: any) => {
        const getPrio = (item: any) => {
          const cat = item.category || '';
          if (cat === 'Chùa') return 1;
          if (cat === 'Văn hóa') return 2;
          if (cat === 'Ẩm thực') return 3;
          return 4;
        };
        const orderA = getPrio(a);
        const orderB = getPrio(b);
        if (orderA !== orderB) return orderA - orderB;
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
        return dateB - dateA;
      });
      setDestinations(sortedData);
    });

    const qVocab = query(collection(db, 'vocab_categories'));
    const unsubVocab = onSnapshot(qVocab, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = data.sort((a: any, b: any) => {
        // Sort by order first, then by createdAt (newest first)
        if ((a.order || 99) !== (b.order || 99)) return (a.order || 99) - (b.order || 99);
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setCategories(sortedData);
    });

    setLoading(false);
    return () => {
      unsubDest();
      unsubVocab();
    };
  }, []);

  const handleSaveDest = async () => {
    if (!dName.trim() || !dImg.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và link ảnh');
      return;
    }
    try {
      const finalId = editingDest ? editingDest.id : `${dCat}_${Date.now()}`;
      const destData = {
        name: dName,
        name_khmer: dNameKm,
        location: dLoc,
        location_khmer: dLocKm,
        description: dDesc,
        description_khmer: dDescKm,
        imageUrl: dImg,
        imageUrl1: dImg1,
        imageUrl2: dImg2,
        imageUrl3: dImg3,
        imageUrl4: dImg4,
        imageUrl5: dImg5,
        imageUrl6: dImg6,
        latitude: dLat,
        longitude: dLng,
        category: dCat === 'pagoda' ? 'Chùa' : dCat === 'food' ? 'Ẩm thực' : 'Văn hóa',
        contentBlocks: dBlocks.filter(b => b.value.trim() !== '' || b.images.trim() !== ''),
        createdAt: editingDest ? (editingDest.createdAt || new Date()) : new Date()
      };
      await setDoc(doc(db, 'destinations', finalId), destData);
      setDestModalVisible(false);
      triggerToast('Đã lưu nội dung thành công', 'success');
    } catch (e) {
      console.error(e);
      triggerToast('Không thể lưu nội dung', 'error');
    }
  };

  const handleDeleteDest = (id: string, name: string) => {
    setPendingDelete({ id, name });
    setDeleteType('destination');
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (deleteType === 'destination') {
        const docRef = doc(db, 'destinations', pendingDelete.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await setDoc(doc(db, 'system_trash', pendingDelete.id), {
            ...docSnap.data(),
            originalId: pendingDelete.id,
            originalCollection: 'destinations',
            deletedAt: new Date()
          });
          await deleteDoc(docRef);
          triggerToast('Đã chuyển nội dung vào thùng rác', 'success');
        }
      } else if (deleteType === 'topic') {
        const topic = pendingDelete;
        await setDoc(doc(db, 'system_trash', topic.id), {
          ...topic,
          originalId: topic.id,
          originalCollection: 'vocab_categories',
          deletedAt: new Date()
        });
        await deleteDoc(doc(db, 'vocab_categories', topic.id));
        triggerToast('Đã chuyển chủ đề vào thùng rác', 'success');
      } else if (deleteType === 'word') {
        const { topicId, word } = pendingDelete;
        await updateDoc(doc(db, 'vocab_categories', topicId), {
          words: arrayRemove(word)
        });
        triggerToast('Đã xóa từ vựng thành công', 'success');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Lỗi khi thực hiện xóa', 'error');
    } finally {
      setDeleteConfirmVisible(false);
      setPendingDelete(null);
    }
  };

  const handleSaveTopic = async () => {
    if (!topicTitle.trim()) return;
    try {
      const topicData: any = {
        title: topicTitle,
        title_khmer: topicTitleKm,
        imageUrl: topicImg,
        order: editingTopic ? (editingTopic.order || 99) : 0, // New topics get order 0 to stay first if order is same
        words: editingTopic ? editingTopic.words : []
      };

      if (editingTopic) {
        await updateDoc(doc(db, 'vocab_categories', editingTopic.id), topicData);
      } else {
        topicData.createdAt = new Date();
        const slugId = topicTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');

        const finalId = slugId || `topic_${Date.now()}`;
        await setDoc(doc(db, 'vocab_categories', finalId), topicData);
      }
      setTopicModalVisible(false);
      triggerToast('Cập nhật chủ đề thành công', 'success');
    } catch (e) {
      triggerToast('Lỗi khi lưu chủ đề', 'error');
    }
  };

  const handleSaveWord = async () => {
    if (!wordKhm.trim() || !wordVie.trim() || !selectedTopic) return;
    try {
      const topicRef = doc(db, 'vocab_categories', selectedTopic.id);
      const topicSnap = await getDoc(topicRef);
      if (!topicSnap.exists()) return;

      const currentWords = topicSnap.data().words || [];

      if (editingWord) {
        const updatedWords = currentWords.map((w: any) => {
          const isMatch = (editingWord.id && w.id === editingWord.id) || (w.khm === editingWord.khm);
          if (isMatch) {
            return {
              ...w,
              id: w.id || 'w_' + Date.now(),
              khm: wordKhm,
              vie: wordVie,
              life: wordVie,
              pronunciation: wordPron,
              imageUrl: wordImg
            };
          }
          return w;
        });
        await updateDoc(topicRef, { words: updatedWords });
      } else {
        await updateDoc(topicRef, {
          words: arrayUnion({
            id: 'w_' + Date.now(),
            khm: wordKhm,
            vie: wordVie,
            life: wordVie,
            pronunciation: wordPron,
            imageUrl: wordImg
          })
        });
      }
      setWordModalVisible(false);
      triggerToast('Đã cập nhật từ vựng', 'success');
    } catch (e) { triggerToast('Không thể lưu từ vựng', 'error'); }
  };

  const deleteTopic = (topic: any) => {
    setPendingDelete(topic);
    setDeleteType('topic');
    setDeleteConfirmVisible(true);
  };

  const deleteWord = async (topic: any, word: any) => {
    setPendingDelete({ topicId: topic.id, word });
    setDeleteType('word');
    setDeleteConfirmVisible(true);
  };

  // Derived managingTopic
  const managingTopic = useMemo(() => categories.find(c => c.id === managingTopicId), [categories, managingTopicId]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, vs(10)) }]}>
      {/* Premium Toast System */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedToastStyle,
            {
              backgroundColor: toastType === 'error' ? '#EF4444' : '#10B981',
              shadowColor: toastType === 'error' ? '#EF4444' : '#10B981',
            }
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons
              name={toastType === 'success' ? "checkmark" : "close"}
              size={ms(20)}
              color="#FFF"
            />
          </View>
          <Text style={styles.toastText} numberOfLines={1} adjustsFontSizeToFit>{toastMsg}</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={ms(28)} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý nội dung</Text>
        <TouchableOpacity
          onPress={() => {
            if (activeTab === 'vocabulary') {
              setEditingTopic(null);
              setTopicTitle('');
              setTopicTitleKm('');
              setTopicImg('');
              setTopicModalVisible(true);
            } else {
              setEditingDest(null);
              setDName(''); setDNameKm(''); setDLoc(''); setDLocKm(''); setDDesc(''); setDDescKm(''); setDImg('');
              setDImg1(''); setDImg2(''); setDImg3(''); setDImg4(''); setDImg5(''); setDImg6('');
              setDLat(''); setDLng('');
              setDBlocks([]);
              setDCat('pagoda');
              setDestModalVisible(true);
            }
          }}
          style={styles.addBtnHeader}
        >
          <Ionicons name="add" size={ms(32)} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'destinations' && styles.activeTab]} onPress={() => setActiveTab('destinations')}>
          <Text style={[styles.tabText, activeTab === 'destinations' && styles.activeTabText]} numberOfLines={1} adjustsFontSizeToFit>Nội dung</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'vocabulary' && styles.activeTab]} onPress={() => setActiveTab('vocabulary')}>
          <Text style={[styles.tabText, activeTab === 'vocabulary' && styles.activeTabText]} numberOfLines={1} adjustsFontSizeToFit>Học tập</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: vs(50) }} /> : (
        <FlatList
          data={activeTab === 'destinations'
            ? destinations
            : categories.filter(c => c.title.toLowerCase().includes(vocabSearchQuery.toLowerCase()))
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => activeTab === 'destinations' ? (
            <DestItem
              item={item}
              onPreview={(dest: any) => {
                const pathname = dest.id.includes('pagoda') ? '/pagoda-detail' :
                  dest.id.includes('culture') ? '/culture-detail' :
                    '/food-detail';
                router.push({ pathname: pathname as any, params: { id: dest.id } });
              }}
              onEdit={(dest: any) => {
                setEditingDest(dest);
                setDName(dest.name || '');
                setDNameKm(dest.name_khmer || '');
                setDLoc(dest.location || '');
                setDLocKm(dest.location_khmer || '');
                setDDesc(dest.description || '');
                setDDescKm(dest.description_khmer || '');
                setDImg(dest.imageUrl || '');
                setDImg1(dest.imageUrl1 || '');
                setDImg2(dest.imageUrl2 || '');
                setDImg3(dest.imageUrl3 || '');
                setDImg4(dest.imageUrl4 || '');
                setDImg5(dest.imageUrl5 || '');
                setDImg6(dest.imageUrl6 || '');
                setDLat(dest.latitude || '');
                setDLng(dest.longitude || '');
                setDBlocks(dest.contentBlocks || []);
                const lowerCat = (dest.category || '').toLowerCase();
                const lowerId = (dest.id || '').toLowerCase();
                const currentCat = (lowerCat === 'ẩm thực' || lowerCat === 'food' || lowerId.includes('food')) ? 'food' :
                  (lowerCat === 'văn hóa' || lowerCat === 'culture' || lowerId.includes('culture')) ? 'culture' :
                    'pagoda';
                setDCat(currentCat);
                setDestModalVisible(true);
              }}
              onDelete={handleDeleteDest}
            />
          ) : (
            <VocabItem
              item={item}
              getImageSource={getImageSource}
              onManage={(id: string) => setManagingTopicId(id)}
              onEdit={(topic: any) => {
                setEditingTopic(topic);
                setTopicTitle(topic.title);
                setTopicTitleKm(topic.title_khmer || '');
                setTopicImg(topic.imageUrl || '');
                setTopicModalVisible(true);
              }}
              onDelete={deleteTopic}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      {/* --- Word Management Modal --- */}
      <Modal visible={!!managingTopicId} animationType="slide" statusBarTranslucent={true}>
        <View style={[styles.container, { paddingTop: Math.max(insets.top, vs(10)) }]}>
          <View style={[styles.header, { marginTop: 0, paddingHorizontal: s(12) }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setManagingTopicId(null)}>
              <Ionicons name="arrow-back" size={ms(28)} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
              {managingTopic?.title === 'cat_family' ? 'Gia đình thân yêu' :
                managingTopic?.title === 'cat_food' ? 'Ẩm thực đặc sắc' :
                  managingTopic?.title === 'cat_greetings' ? 'Chào hỏi thông dụng' :
                    managingTopic?.title === 'cat_numbers' ? 'Số đếm cơ bản' :
                      managingTopic?.title}
            </Text>
            <TouchableOpacity
              style={styles.addBtnHeader}
              onPress={() => {
                setSelectedTopic(managingTopic);
                setEditingWord(null);
                setWordKhm('');
                setWordVie('');
                setWordPron('');
                setWordImg('');
                setWordModalVisible(true);
              }}
            >
              <Ionicons name="add" size={ms(26)} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={managingTopic?.words || []}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={{ padding: s(16) }}
            renderItem={({ item: word }) => (
              <WordItem
                word={word}
                onEdit={(w: any) => {
                  setSelectedTopic(managingTopic);
                  setEditingWord(w);
                  setWordKhm(w.khm);
                  setWordVie(w.life || w.vie);
                  setWordPron(w.pronunciation);
                  setWordImg(w.imageUrl || '');
                  setWordModalVisible(true);
                }}
                onDelete={(w: any) => deleteWord(managingTopic, w)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Ionicons name="book-outline" size={ms(80)} color="#e2e8f0" />
                <Text style={styles.emptyWords}>Chưa có từ vựng nào trong chủ đề này</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* --- Destination Modal --- */}
      <Modal visible={destModalVisible} animationType="slide" transparent statusBarTranslucent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={[styles.modalContentFull, { paddingTop: insets.top + vs(10) }]}>
            <View style={[styles.modalHeader, { marginBottom: vs(10) }]}>
              <View style={{ width: s(40) }} />
              <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit>
                {editingDest ? 'Sửa nội dung' : 'Thêm nội dung'}
              </Text>
              <TouchableOpacity onPress={() => setDestModalVisible(false)}>
                <Ionicons name="close" size={ms(30)} color="#ff0000ff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {!editingDest && (
                <View style={styles.catRow}>
                  {['pagoda', 'culture', 'food'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catBtn, dCat === cat && styles.activeCatBtn]}
                      onPress={() => setDCat(cat as any)}
                    >
                      <Text style={[styles.catBtnText, dCat === cat && styles.activeCatBtnText]}>
                        {cat === 'pagoda' ? 'Chùa Khmer' : cat === 'culture' ? 'Văn hóa' : 'Ẩm thực'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.inputLabel, { marginTop: editingDest ? 0 : 12 }]}>{dCat === 'pagoda' ? 'Tên ngôi chùa (Việt)' : dCat === 'food' ? 'Tên món ăn (Việt)' : 'Tên văn hóa (Việt)'}</Text>
              <TextInput style={styles.input} value={dName} onChangeText={setDName} placeholder="Nhập tên tiếng Việt..." />

              <Text style={styles.inputLabel}>{dCat === 'pagoda' ? 'Tên ngôi chùa (Khmer)' : dCat === 'food' ? 'Tên món ăn (Khmer)' : 'Tên văn hóa (Khmer)'}</Text>
              <TextInput style={styles.input} value={dNameKm} onChangeText={setDNameKm} placeholder="Nhập tên tiếng Khmer..." />

              <Text style={styles.inputLabel}>{dCat === 'pagoda' ? 'Địa chỉ chùa (Việt)' : 'Địa chỉ (Việt)'}</Text>
              <TextInput style={styles.input} value={dLoc} onChangeText={setDLoc} placeholder="Nhập địa chỉ..." />

              <Text style={styles.inputLabel}>{dCat === 'pagoda' ? 'Địa chỉ chùa (Khmer)' : 'Địa chỉ (Khmer)'}</Text>
              <TextInput style={styles.input} value={dLocKm} onChangeText={setDLocKm} placeholder="Nhập địa chỉ tiếng Khmer..." />

              <Text style={styles.inputLabel}>Mô tả chính (Việt)</Text>
              <TextInput style={[styles.input, { height: 110 }]} value={dDesc} onChangeText={setDDesc} multiline numberOfLines={4} placeholder="Mô tả tóm tắt..." />

              <Text style={styles.inputLabel}>Mô tả chính (Khmer)</Text>
              <TextInput style={[styles.input, { height: 110 }]} value={dDescKm} onChangeText={setDDescKm} multiline numberOfLines={4} placeholder="Mô tả tiếng Khmer..." />

              <ImageSelector label="Ảnh đại diện chính" value={dImg} onChange={setDImg} />

              {dCat === 'pagoda' ? (
                <ImageSelector label="Ảnh đại diện phụ" value={dImg1} onChange={setDImg1} />
              ) : dCat === 'culture' ? (
                <ImageSelector label="Ảnh đại diện phụ 1" value={dImg6} onChange={setDImg6} />
              ) : (
                <ImageSelector label="Ảnh đại diện phụ 1" value={dImg1} onChange={setDImg1} />
              )}

              {dCat !== 'pagoda' && (
                <>
                  <Text style={styles.inputLabel}>Bộ sưu tập ảnh</Text>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 15 }}>
                    <ImageSelector
                      label="Ảnh 1"
                      value={dCat === 'culture' ? dImg1 : dImg2}
                      onChange={dCat === 'culture' ? setDImg1 : setDImg2}
                      style={{ flex: 1, minWidth: '45%' }}
                    />
                    <ImageSelector
                      label="Ảnh 2"
                      value={dCat === 'culture' ? dImg2 : dImg3}
                      onChange={dCat === 'culture' ? setDImg2 : setDImg3}
                      style={{ flex: 1, minWidth: '45%' }}
                    />
                    <ImageSelector
                      label="Ảnh 3"
                      value={dCat === 'culture' ? dImg3 : dImg4}
                      onChange={dCat === 'culture' ? setDImg3 : setDImg4}
                      style={{ flex: 1, minWidth: '45%' }}
                    />
                    <ImageSelector
                      label="Ảnh 4"
                      value={dCat === 'culture' ? dImg4 : dImg5}
                      onChange={dCat === 'culture' ? setDImg4 : setDImg5}
                      style={{ flex: 1, minWidth: '45%' }}
                    />
                    <ImageSelector
                      label="Ảnh 5"
                      value={dCat === 'culture' ? dImg5 : dImg6}
                      onChange={dCat === 'culture' ? setDImg5 : setDImg6}
                      style={{ flex: 1, minWidth: '45%' }}
                    />
                  </View>
                </>
              )}

              {(dCat !== 'culture' && dCat !== 'food') && (
                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Vĩ độ</Text>
                    <TextInput style={styles.input} value={dLat} onChangeText={setDLat} placeholder="Nhập vĩ độ..." keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Kinh độ</Text>
                    <TextInput style={styles.input} value={dLng} onChangeText={setDLng} placeholder="Nhập kinh độ..." keyboardType="numeric" />
                  </View>
                </View>
              )}

              <View style={styles.divider} />
              <Text style={[styles.modalTitle, { marginTop: 0 }]}>Khối nội dung chi tiết</Text>

              <View style={{ marginTop: 15 }}>
                {dBlocks.map((block, index) => (
                  <View key={index} style={styles.blockItem}>
                    <View style={styles.blockHeader}>
                      <Text style={styles.blockNumber}>Khối {index + 1}</Text>
                      <TouchableOpacity onPress={() => setDBlocks(dBlocks.filter((_, i) => i !== index))}>
                        <Ionicons name="trash" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <ImageSelector
                      label="Ảnh nội dung"
                      value={block.images}
                      onChange={(val) => {
                        const newBlocks = [...dBlocks];
                        newBlocks[index].images = val;
                        setDBlocks(newBlocks);
                      }}
                    />

                    <Text style={styles.inputLabel}>Nội dung (Việt)</Text>
                    <TextInput style={[styles.input, { height: 80 }]} value={block.value} onChangeText={(val) => {
                      const newBlocks = [...dBlocks];
                      newBlocks[index].value = val;
                      setDBlocks(newBlocks);
                    }} multiline placeholder="Mô tả..." />

                    <Text style={styles.inputLabel}>Nội dung (Khmer)</Text>
                    <TextInput style={[styles.input, { height: 80 }]} value={block.value_khmer} onChangeText={(val) => {
                      const newBlocks = [...dBlocks];
                      newBlocks[index].value_khmer = val;
                      setDBlocks(newBlocks);
                    }} multiline placeholder="Mô tả..." />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addBlockBtn}
                onPress={() => setDBlocks([...dBlocks, { images: '', value: '', value_khmer: '' }])}
              >
                <Text style={styles.addBlockText} numberOfLines={1} adjustsFontSizeToFit>Thêm khối nội dung</Text>
              </TouchableOpacity>

              <View style={{ height: 5 }} />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDest}>
              <Text style={styles.saveBtnText} numberOfLines={1} adjustsFontSizeToFit>Lưu nội dung</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- Vocabulary Category Modal --- */}
      <Modal visible={topicModalVisible} animationType="fade" transparent statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>{editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400, marginTop: 10 }}>

              <Text style={styles.inputLabel}>Tên chủ đề (tiếng Việt)</Text>
              <TextInput style={styles.input} placeholder="Ví dụ: Gia đình thân yêu" value={topicTitle} onChangeText={setTopicTitle} />

              <Text style={styles.inputLabel}>Tên chủ đề (tiếng Khmer)</Text>
              <TextInput style={styles.input} placeholder="Ví dụ: គ្រួសារ និងការហៅទូរសព្ទ" value={topicTitleKm} onChangeText={setTopicTitleKm} />

              <ImageSelector label="Ảnh đại diện chủ đề" value={topicImg} onChange={setTopicImg} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setTopicModalVisible(false)}><Text style={styles.cancelBtnText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveTopic}><Text style={styles.saveBtnText}>Lưu</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Word Modal --- */}
      <Modal visible={wordModalVisible} animationType="fade" transparent statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 15 }]}>
              {editingWord ? 'Sửa từ vựng' : 'Thêm từ vựng'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <View style={styles.modalForm}>
                <Text style={styles.inputLabel}>Tiếng Khmer</Text>
                <TextInput style={styles.input} placeholder="Ví dụ: គ្រួសារ" value={wordKhm} onChangeText={setWordKhm} />

                <Text style={styles.inputLabel}>Phiên âm (Phụ âm)</Text>
                <TextInput style={styles.input} placeholder="Ví dụ: kruosaear" value={wordPron} onChangeText={setWordPron} />

                <Text style={styles.inputLabel}>Tiếng Việt</Text>
                <TextInput style={styles.input} placeholder="Ví dụ: Gia đình" value={wordVie} onChangeText={setWordVie} />

                <ImageSelector label="Ảnh từ vựng" value={wordImg} onChange={setWordImg} />
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { marginTop: 20 }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1, marginRight: 10 }]}
                onPress={() => setWordModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtnSmall, { flex: 1.5 }]}
                onPress={handleSaveWord}
              >
                <Text style={styles.saveBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Custom Delete Confirmation Modal --- */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade" statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="trash" size={34} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 10 }]}>Xác nhận xóa</Text>
            <Text style={styles.confirmSubText}>
              Bạn có chắc chắn muốn xóa {deleteType === 'word' ? 'từ vựng' : deleteType === 'topic' ? 'chủ đề' : 'nội dung'} này
            </Text>
            <View style={[styles.modalActions, { justifyContent: 'center', gap: 15 }]}>
              <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: '#3b82f6', flex: 1 }]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.saveBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtnSmall, { backgroundColor: '#ef4444', flex: 1 }]} onPress={confirmDelete}>
                <Text style={styles.saveBtnText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(12), height: vs(60), position: 'relative' },
  backBtn: { width: s(44), height: s(44), justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  addBtnHeader: { width: s(42), height: s(42), backgroundColor: '#f1f5f9', borderRadius: s(12), justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  headerTitle: { flex: 1, fontSize: ms(20), fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  tabBar: { flexDirection: 'row', marginHorizontal: s(16), marginTop: vs(10), backgroundColor: '#f1f5f9', borderRadius: s(12), padding: s(4) },
  tab: { flex: 1, paddingVertical: vs(10), alignItems: 'center', borderRadius: s(10) },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowOpacity: 0.1 },
  tabText: { fontSize: ms(14), fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#3b82f6' },
  listContent: { padding: s(12), paddingBottom: vs(20) },
  card: { backgroundColor: '#fff', borderRadius: ms(20), marginBottom: vs(12), overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardImage: { width: '100%', height: vs(200) },
  cardContent: { padding: s(15) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10) },
  cardTitle: { fontSize: ms(13), fontWeight: '800', color: '#1e293b' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: vs(10), alignItems: 'center' },
  rightActions: { flexDirection: 'row', gap: s(12) },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: s(5), backgroundColor: '#f1f5f9', paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: s(8) },
  viewBtnText: { fontSize: ms(12), fontWeight: '700', color: '#3b82f6' },
  editBtn: { backgroundColor: '#f0f9ff', paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: s(8), justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { backgroundColor: '#fef2f2', paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: s(8), justifyContent: 'center', alignItems: 'center' },
  vocabPremiumCard: {
    backgroundColor: '#fff',
    borderRadius: ms(24),
    marginBottom: vs(20),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  vocabPreviewTab: { flex: 1 },
  vocabLargeImageContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#f8fafc',
    padding: s(20)
  },
  vocabLargeImage: { width: '100%', height: '100%' },
  vocabCardFooter: { padding: s(16), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vocabLargeTitle: { fontSize: ms(13), fontWeight: '800', color: '#1e293b' },
  footerActionGroup: { flexDirection: 'row', gap: s(8) },
  footerActionBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  premiumWordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: s(15),
    borderRadius: ms(16),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  wordMainContent: { flex: 1 },
  wordKhmText: { fontSize: ms(20), fontWeight: '800', color: '#1e293b' },
  pronText: { fontSize: ms(12), color: '#64748b', fontStyle: 'italic' },
  wordVieText: { fontSize: ms(12), color: '#3b82f6', fontWeight: '700', marginTop: vs(2) },
  wordActionGroup: { flexDirection: 'row', gap: s(6) },
  miniActionBtn: { width: s(32), height: s(32), borderRadius: s(10), backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  emptyStateContainer: { marginTop: vs(150), alignItems: 'center', padding: s(30), opacity: 0.5 },
  emptyWords: { marginTop: vs(5), fontSize: ms(13), color: '#94a3b8', fontStyle: 'italic' },
  // Form Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentFull: { width: '100%', height: '100%', backgroundColor: '#fff', padding: s(20) },
  modalContentSmall: { width: '85%', backgroundColor: '#fff', borderRadius: ms(20), padding: s(20) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(20) },
  modalTitle: { fontSize: ms(22), fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  modalForm: { flex: 1 },
  inputLabel: { fontSize: ms(13), fontWeight: '700', color: '#64748b', marginBottom: vs(8), marginTop: vs(12) },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: s(12), padding: s(12), fontSize: ms(15), color: '#1e293b', marginBottom: vs(5) },
  catRow: { flexDirection: 'row', gap: s(10), marginBottom: vs(10) },
  catBtn: { flex: 1, paddingVertical: vs(10), paddingHorizontal: s(4), alignItems: 'center', borderRadius: s(10), backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeCatBtn: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  catBtnText: { fontSize: ms(11), fontWeight: '700', color: '#64748b', textAlign: 'center' },
  activeCatBtnText: { color: '#fff' },
  saveBtn: { backgroundColor: '#3b82f6', paddingVertical: vs(15), borderRadius: s(12), alignItems: 'center', marginTop: vs(20) },
  saveBtnSmall: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: vs(12), borderRadius: s(10), alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: ms(16), textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'center', gap: s(10), marginTop: vs(20) },
  cancelBtn: { flex: 1, backgroundColor: '#ef4444', paddingVertical: vs(12), borderRadius: s(10), alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: vs(20) },
  blockItem: { backgroundColor: '#f8fafc', padding: s(15), borderRadius: ms(16), marginBottom: vs(15), borderWidth: 1, borderColor: '#e2e8f0' },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(10) },
  blockNumber: { fontSize: ms(14), fontWeight: '800', color: '#1e293b' },
  addBlockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), paddingVertical: vs(12), borderStyle: 'dashed', borderWidth: 1, borderColor: '#3b82f6', borderRadius: s(12), marginTop: vs(10) },
  addBlockText: { fontSize: ms(14), fontWeight: '700', color: '#3b82f6' },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: s(16),
    right: s(16),
    minHeight: vs(56),
    paddingVertical: vs(8),
    borderRadius: ms(18),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  toastIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: ms(15),
    fontWeight: '700',
    marginLeft: s(12),
    flex: 1,
    letterSpacing: 0.2,
    includeFontPadding: false,
    lineHeight: ms(22),
  },
  confirmIconBg: {
    width: s(66),
    height: s(66),
    borderRadius: s(33),
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: vs(16),
  },
  confirmSubText: {
    fontSize: ms(14),
    color: '#64748b',
    textAlign: 'center',
    lineHeight: vs(22),
    marginBottom: vs(5),
  },
  imagePickerBtn: {
    width: '100%',
    height: vs(150),
    backgroundColor: '#f8fafc',
    borderRadius: s(16),
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginTop: vs(8),
  },
  imagePickerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(8) },
  imagePickerText: { fontSize: ms(14), color: '#94a3b8', fontWeight: '600' },
  pickedImagePreview: { width: '100%', height: '100%' },
  removeImageBtn: {
    position: 'absolute',
    top: vs(10),
    right: s(10),
    backgroundColor: '#fff',
    borderRadius: s(12),
    padding: s(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default ContentManagement;