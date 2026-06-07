import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc } from 'firebase/firestore';
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
  View
} from 'react-native';
import { db } from '../../utils/firebaseConfig';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState<'destinations' | 'vocabulary'>('destinations');
  const [vocabSubTab, setVocabSubTab] = useState<'topic' | 'translate'>('topic');
  const [destinations, setDestinations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const translateY = useRef(new Animated.Value(-100)).current;

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
  const [dBlocks, setDBlocks] = useState<any[]>([]);

  // Vocabulary Form State
  const [topicModalVisible, setTopicModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicTitleKm, setTopicTitleKm] = useState('');
  const [topicImg, setTopicImg] = useState('');
  const [topicIconName, setTopicIconName] = useState('');
  const [topicColor, setTopicColor] = useState('#3b82f6');
  const [topicManualId, setTopicManualId] = useState('');

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
          const id = item.id || '';
          if (cat === 'pagoda' || id.includes('pagoda')) return 1;
          if (cat === 'culture' || id.includes('culture')) return 2;
          if (cat === 'food' || id.includes('food')) return 3;
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
        category: dCat,
        contentBlocks: dBlocks.filter(b => b.value.trim() !== '' || b.images.trim() !== ''),
        createdAt: editingDest ? (editingDest.createdAt || new Date()) : new Date()
      };
      await setDoc(doc(db, 'destinations', finalId), destData);
      setDestModalVisible(false);
      showToast('Đã lưu nội dung thành công', 'success');
    } catch (e) {
      console.error(e);
      showToast('Không thể lưu nội dung', 'error');
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
          showToast('Đã chuyển nội dung vào thùng rác', 'success');
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
        showToast('Đã chuyển chủ đề vào thùng rác', 'success');
      } else if (deleteType === 'word') {
        const { topicId, word } = pendingDelete;
        await updateDoc(doc(db, 'vocab_categories', topicId), {
          words: arrayRemove(word)
        });
        showToast('Đã xóa từ vựng thành công', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi thực hiện xóa', 'error');
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
      showToast('Cập nhật chủ đề thành công!', 'success');
    } catch (e) {
      showToast('Lỗi khi lưu chủ đề', 'error');
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
        // Update existing word - match by id or khm
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
      showToast('Đã cập nhật từ vựng', 'success');
    } catch (e) { Alert.alert('Lỗi', 'Không thể lưu từ vựng'); }
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

  const renderDestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.name}</Text></View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => {
              const pathname = item.id.includes('pagoda') ? '/pagoda-detail' :
                item.id.includes('culture') ? '/culture-detail' :
                  '/food-detail';
              router.push({ pathname: pathname as any, params: { id: item.id } });
            }}
          >
            <Ionicons name="eye-outline" size={18} color="#3b82f6" />
            <Text style={styles.viewBtnText} numberOfLines={1} adjustsFontSizeToFit>Xem chi tiết</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditingDest(item);
                setDName(item.name || '');
                setDNameKm(item.name_khmer || '');
                setDLoc(item.location || '');
                setDLocKm(item.location_khmer || '');
                setDDesc(item.description || '');
                setDDescKm(item.description_khmer || '');
                setDImg(item.imageUrl || '');
                setDImg1(item.imageUrl1 || '');
                setDImg2(item.imageUrl2 || '');
                setDImg3(item.imageUrl3 || '');
                setDImg4(item.imageUrl4 || '');
                setDImg5(item.imageUrl5 || '');
                setDImg6(item.imageUrl6 || '');
                setDLat(item.latitude || '');
                setDLng(item.longitude || '');
                setDBlocks(item.contentBlocks || []);
                setDCat(item.id.includes('food') ? 'food' : item.id.includes('culture') ? 'culture' : 'pagoda');
                setDestModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteDest(item.id, item.name)}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderVocabItem = ({ item }: { item: any }) => (
    <View style={styles.vocabPremiumCard}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setManagingTopicId(item.id)}
        style={styles.vocabPreviewTab}
      >
        <View style={styles.vocabLargeImageContainer}>
          <Image
            source={
              item.imageUrl
                ? { uri: item.imageUrl }
                : (item.title === 'cat_family' || item.id === 'family') ? require('@/assets/images/giadinh.jpg') :
                  (item.title === 'cat_food' || item.id === 'food') ? require('@/assets/images/monan.jpg') :
                    (item.title === 'cat_greetings' || item.id === 'greetings') ? require('@/assets/images/chaohoi.jpg') :
                      (item.title === 'cat_numbers' || item.id === 'numbers') ? require('@/assets/images/sodem.jpg') :
                        require('@/assets/images/giadinh.jpg')
            }
            style={styles.vocabLargeImage}
          />
        </View>

        <View style={styles.vocabCardFooter}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vocabLargeTitle}>
              {item.title === 'cat_family' ? 'Gia đình thân yêu' :
                item.title === 'cat_food' ? 'Ẩm thực đặc sắc' :
                  item.title === 'cat_greetings' ? 'Chào hỏi thông dụng' :
                    item.title === 'cat_numbers' ? 'Số đếm cơ bản' :
                      item.title}
            </Text>
          </View>
          <View style={styles.footerActionGroup}>
            <TouchableOpacity
              style={styles.footerActionBtn}
              onPress={() => {
                setEditingTopic(item);
                setTopicTitle(item.title);
                setTopicTitleKm(item.title_khmer || '');
                setTopicImg(item.imageUrl || '');
                setTopicModalVisible(true);
              }}
            >
              <Ionicons name="pencil" size={18} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerActionBtn, { borderColor: '#fee2e2' }]}
              onPress={() => deleteTopic(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Derived managingTopic
  const managingTopic = categories.find(c => c.id === managingTopicId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={28} color="#1e293b" /></TouchableOpacity>
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
          <Ionicons name="add" size={32} color="#3b82f6" />
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

      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} /> : (
        <FlatList
          data={activeTab === 'destinations'
            ? destinations
            : categories.filter(c => c.title.toLowerCase().includes(vocabSearchQuery.toLowerCase()))
          }
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'destinations' ? renderDestItem : renderVocabItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* --- Word Management Modal (FULL SCREEN) --- */}
      <Modal visible={!!managingTopicId} animationType="slide" statusBarTranslucent={true}>
        <View style={[styles.container, { paddingTop: 45, backgroundColor: '#ffffff' }]}>
          <View style={[styles.header, { marginTop: 0, paddingHorizontal: 12, backgroundColor: '#ffffff' }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setManagingTopicId(null)}>
              <Ionicons name="arrow-back" size={28} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
              {managingTopic?.title === 'cat_family' ? 'Gia đình thân yêu' :
                managingTopic?.title === 'cat_food' ? 'Ẩm thực đặc sắc' :
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
              <Ionicons name="add" size={26} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={managingTopic?.words || []}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: word }) => (
              <View style={styles.premiumWordItem}>
                <View style={styles.wordMainContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.wordKhmText}>{word.khm}</Text>
                    <Text style={[styles.wordVieText, { color: '#3b82f6', marginTop: 0, marginLeft: 15 }]}>{word.life || word.vie}</Text>
                  </View>
                  <Text style={[styles.pronText, { marginTop: 4 }]}>{word.pronunciation}</Text>
                </View>

                <View style={styles.wordActionGroup}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedTopic(managingTopic);
                      setEditingWord(word);
                      setWordKhm(word.khm);
                      setWordVie(word.life || word.vie);
                      setWordPron(word.pronunciation);
                      setWordImg(word.imageUrl || '');
                      setWordModalVisible(true);
                    }}
                    style={styles.miniActionBtn}
                  >
                    <Ionicons name="pencil" size={14} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteWord(managingTopic, word)}
                    style={[styles.miniActionBtn, { borderColor: '#fee2e2' }]}
                  >
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Ionicons name="book-outline" size={80} color="#e2e8f0" />
                <Text style={styles.emptyWords}>Chưa có từ vựng nào trong chủ đề này</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* --- Destination Modal --- */}
      <Modal visible={destModalVisible} animationType="slide" transparent statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentFull}>
            <View style={[styles.modalHeader, { marginBottom: editingDest ? 10 : 10 }]}>
              <View style={{ width: 40 }} />
              <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit>
                {editingDest ? 'Sửa nội dung' : 'Thêm nội dung'}
              </Text>
              <TouchableOpacity onPress={() => setDestModalVisible(false)}>
                <Ionicons name="close" size={28} color="#ff0000ff" />
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
                      <Text style={[styles.catBtnText, dCat === cat && styles.activeCatBtnText]} numberOfLines={1} adjustsFontSizeToFit>
                        {cat === 'pagoda' ? 'Ngôi chùa' : cat === 'culture' ? 'Văn hóa' : 'Ẩm thực'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.inputLabel, { marginTop: editingDest ? 0 : 12 }]}>{dCat === 'pagoda' ? 'Tên ngôi chùa (Việt)' : dCat === 'food' ? 'Tên món ăn (Việt)' : 'Tên văn hóa (Việt)'}</Text>
              <TextInput style={styles.input} value={dName} onChangeText={setDName} placeholder="Nhập tên tiếng Việt..." />

              <Text style={styles.inputLabel}>{dCat === 'pagoda' ? 'Tên ngôi chùa (Khmer)' : dCat === 'food' ? 'Tên món ăn (Khmer)' : 'Tên văn hóa (Khmer)'}</Text>
              <TextInput style={styles.input} value={dNameKm} onChangeText={setDNameKm} placeholder="Nhập tên tiếng Khmer..." />

              <Text style={styles.inputLabel}>{dCat === 'pagoda' ? 'Địa chỉ chùa (Việt)' : 'Nội dung phụ (Việt)'}</Text>
              <TextInput style={styles.input} value={dLoc} onChangeText={setDLoc} placeholder={dCat === 'pagoda' ? "Nhập địa chỉ tiếng Việt..." : "Nhập nội dung phụ tiếng Việt..."} />

              <Text style={styles.inputLabel}>{dCat === 'pagoda' ? 'Địa chỉ chùa (Khmer)' : 'Nội dung phụ (Khmer)'}</Text>
              <TextInput style={styles.input} value={dLocKm} onChangeText={setDLocKm} placeholder={dCat === 'pagoda' ? "Nhập địa chỉ tiếng Khmer..." : "Nhập nội dung phụ tiếng Khmer..."} />

              <Text style={styles.inputLabel}>Mô tả chính (Việt)</Text>
              <TextInput style={[styles.input, { height: 110 }]} value={dDesc} onChangeText={setDDesc} multiline numberOfLines={4} placeholder="Mô tả tóm tắt..." />

              <Text style={styles.inputLabel}>Mô tả chính (Khmer)</Text>
              <TextInput style={[styles.input, { height: 110 }]} value={dDescKm} onChangeText={setDDescKm} multiline numberOfLines={4} placeholder="Mô tả tiếng Khmer..." />

              <Text style={styles.inputLabel}>Link ảnh đại diện</Text>
              <TextInput style={styles.input} value={dImg} onChangeText={setDImg} placeholder="Nhập link ảnh chính..." />

              <Text style={styles.inputLabel}>Link ảnh phụ</Text>
              <TextInput style={styles.input} value={dImg1} onChangeText={setDImg1} placeholder="Nhập link ảnh phụ..." />

              {dCat !== 'pagoda' && (
                <>
                  <Text style={styles.inputLabel}>Bộ sưu tập ảnh</Text>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                    <TextInput style={[styles.input, { flex: 1, minWidth: '45%' }]} value={dImg2} onChangeText={setDImg2} placeholder="Ảnh 1..." />
                    <TextInput style={[styles.input, { flex: 1, minWidth: '45%' }]} value={dImg3} onChangeText={setDImg3} placeholder="Ảnh 2..." />
                    <TextInput style={[styles.input, { flex: 1, minWidth: '45%' }]} value={dImg4} onChangeText={setDImg4} placeholder="Ảnh 3..." />
                    <TextInput style={[styles.input, { flex: 1, minWidth: '45%' }]} value={dImg5} onChangeText={setDImg5} placeholder="Ảnh 4..." />
                    <TextInput style={[styles.input, { flex: 1, minWidth: '45%' }]} value={dImg6} onChangeText={setDImg6} placeholder="Ảnh 5..." />
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

                    <Text style={styles.inputLabel}>Link ảnh</Text>
                    <TextInput style={styles.input} value={block.images} onChangeText={(val) => {
                      const newBlocks = [...dBlocks];
                      newBlocks[index].images = val;
                      setDBlocks(newBlocks);
                    }} placeholder="Nhập link ảnh..." />

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
        </View>
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

              <Text style={styles.inputLabel}>Link ảnh của chủ đề</Text>
              <TextInput style={styles.input} placeholder="Nhập link ảnh..." value={topicImg} onChangeText={setTopicImg} />
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
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Tiếng Khmer</Text>
                    <TextInput style={styles.input} placeholder="Ví dụ: គ្រួសារ" value={wordKhm} onChangeText={setWordKhm} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Tiếng Việt</Text>
                    <TextInput style={styles.input} placeholder="Ví dụ: Gia đình" value={wordVie} onChangeText={setWordVie} />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Phiên âm (Phụ âm)</Text>
                <TextInput style={styles.input} placeholder="Ví dụ: kruosaear" value={wordPron} onChangeText={setWordPron} />
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

      {/* --- Premium Toast Notification --- */}
      {toast.visible && (
        <Animated.View style={[
          styles.toastContainer,
          { transform: [{ translateY }] },
          toast.type === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Ionicons
            name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"}
            size={24}
            color="#fff"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 45, height: 60, position: 'relative' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  addBtnHeader: { width: 42, height: 42, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowOpacity: 0.1 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#3b82f6' },
  listContent: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  cardImage: { width: '100%', height: 200, resizeMode: 'cover' },
  cardContent: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  typeBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '700', color: '#3b82f6' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  rightActions: { flexDirection: 'row', gap: 12 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  vocabPremiumCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  vocabPreviewTab: {
    flex: 1
  },
  vocabLargeImageContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#f8fafc',
    padding: 20
  },
  vocabLargeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  vocabCardFooter: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  vocabLargeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b'
  },
  vocabLargeSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2
  },
  footerActionGroup: {
    flexDirection: 'row',
    gap: 8
  },
  footerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  wordListContainerPremium: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc'
  },
  vocabCardActive: { borderColor: '#3b82f6', borderWidth: 1 },
  wordSubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  wordSubTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  addWordInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addWordInlineText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  wordGrid: { gap: 8 },
  premiumWordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  wordMainContent: { flex: 1 },
  wordLangRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordKhmText: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  pronBadge: { backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  pronText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  wordVieText: { fontSize: 12, color: '#3b82f6', fontWeight: '700', marginTop: 2 },
  wordActionGroup: { flexDirection: 'row', gap: 6 },
  miniActionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  emptyStateContainer: { marginTop: 250, alignItems: 'center', padding: 30, opacity: 0.5 },
  emptyWords: { marginTop: 5, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  vocabManagementHeader: { paddingHorizontal: 16, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#3b82f6' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, height: 44 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, color: '#1e293b' },
  subTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8
  },
  subTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  activeSubTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  activeSubTabText: {
    color: '#fff'
  },
  // Form Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentFull: { width: '100%', height: '100%', backgroundColor: '#fff', padding: 20, paddingTop: 45 },
  modalContentSmall: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  modalForm: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b', marginBottom: 5 },
  catRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  catBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeCatBtn: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  catBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  activeCatBtnText: { color: '#fff' },
  saveBtn: { backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnSmall: { backgroundColor: '#3b82f6', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, alignItems: 'center', minWidth: 80 },
  cancelBtnText: { color: '#fff', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  blockItem: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  blockNumber: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  addBlockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 12, marginTop: 10 },
  addBlockText: { fontSize: 14, fontWeight: '700', color: '#3b82f6' },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 9999,
    gap: 12,
  },
  toastSuccess: {
    backgroundColor: '#10b981', // Emerald 500
  },
  toastError: {
    backgroundColor: '#ef4444', // Red 500
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  confirmIconBg: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  confirmSubText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 5,
  },
});

export default ContentManagement;
