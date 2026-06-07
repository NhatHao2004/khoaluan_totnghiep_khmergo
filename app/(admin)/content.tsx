import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
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

  const [wordModalVisible, setWordModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [wordKhm, setWordKhm] = useState('');
  const [wordVie, setWordVie] = useState('');
  const [wordPron, setWordPron] = useState('');

  useEffect(() => {
    setLoading(true);
    // Unsub cho Destinations
    const qDest = query(collection(db, 'destinations'));
    const unsubDest = onSnapshot(qDest, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sắp xếp: Chùa -> Văn hóa -> Ẩm thực, và cái mới nhất nằm trên cùng mỗi loại
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

        // Nếu cùng nhóm, xếp theo createdAt giảm dần (mới nhất lên trên)
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
        return dateB - dateA;
      });
      setDestinations(sortedData);
    });

    // Unsub cho Vocab
    const qVocab = query(collection(db, 'vocab_categories'), orderBy('order', 'asc'));
    const unsubVocab = onSnapshot(qVocab, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    });

    setLoading(false);
    return () => {
      unsubDest();
      unsubVocab();
    };
  }, []);


  // --- Destination Logic ---
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
    Alert.alert('Xóa địa điểm', `Xóa "${name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'destinations', id));
            showToast('Đã xóa nội dung thành công', 'success');
          } catch (e) {
            showToast('Lỗi khi xóa nội dung', 'error');
          }
        }
      }
    ]);
  };

  // --- Vocabulary Logic ---
  const handleSaveTopic = async () => {
    if (!topicTitle.trim()) return;
    try {
      if (editingTopic) {
        await updateDoc(doc(db, 'vocab_categories', editingTopic.id), { title: topicTitle, titleKm: topicTitleKm });
      } else {
        await addDoc(collection(db, 'vocab_categories'), { title: topicTitle, titleKm: topicTitleKm, order: categories.length + 1, words: [] });
      }
      setTopicModalVisible(false);
      showToast('Cập nhật chủ đề thành công!', 'success');
    } catch (e) {
      showToast('Lỗi khi lưu chủ đề', 'error');
    }
  };

  const handleSaveWord = async () => {
    if (!wordKhm.trim() || !wordVie.trim()) return;
    try {
      const topicRef = doc(db, 'vocab_categories', selectedTopic.id);
      if (editingWord) {
        const updatedWords = selectedTopic.words.map((w: any) =>
          w.id === editingWord.id ? { ...w, khm: wordKhm, vie: wordVie, pronunciation: wordPron } : w
        );
        await updateDoc(topicRef, { words: updatedWords });
      } else {
        await updateDoc(topicRef, {
          words: arrayUnion({ id: Date.now().toString(), khm: wordKhm, vie: wordVie, pronunciation: wordPron })
        });
      }
      setWordModalVisible(false);
    } catch (e) { Alert.alert('Lỗi', 'Không thể lưu'); }
  };

  const deleteWord = async (topic: any, word: any) => {
    await updateDoc(doc(db, 'vocab_categories', topic.id), { words: arrayRemove(word) });
  };

  // --- Render Functions ---
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
    <View style={styles.vocabCard}>
      <View style={styles.vocabHeader}>
        <View><Text style={styles.vocabTitle}>{item.title}</Text></View>
        <TouchableOpacity onPress={() => { setEditingTopic(item); setTopicTitle(item.title); setTopicTitleKm(item.titleKm || ''); setTopicModalVisible(true); }}>
          <Ionicons name="pencil" size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      <View style={styles.wordListHeader}>
        <Text style={styles.wordCount}>{item.words?.length || 0} từ</Text>
        <TouchableOpacity style={styles.addWordBtn} onPress={() => { setSelectedTopic(item); setEditingWord(null); setWordKhm(''); setWordVie(''); setWordPron(''); setWordModalVisible(true); }}>
          <Text style={styles.addWordText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
          data={activeTab === 'destinations' ? destinations : categories}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'destinations' ? renderDestItem : renderVocabItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* --- Destination Modal --- */}
      <Modal visible={destModalVisible} animationType="slide" transparent statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentFull}>
            <View style={[styles.modalHeader, { marginBottom: editingDest ? 10 : 20 }]}>
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
      <Modal visible={topicModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>{editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}</Text>
            <TextInput style={styles.input} placeholder="Tên chủ đề (Việt)" value={topicTitle} onChangeText={setTopicTitle} />
            <TextInput style={styles.input} placeholder="Tên chủ đề (Khmer)" value={topicTitleKm} onChangeText={setTopicTitleKm} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setTopicModalVisible(false)}><Text style={styles.cancelBtnText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveTopic}><Text style={styles.saveBtnText}>Lưu</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Word Modal --- */}
      <Modal visible={wordModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>{editingWord ? 'Sửa từ vựng' : 'Thêm từ vựng'}</Text>
            <TextInput style={styles.input} placeholder="Tiếng Khmer" value={wordKhm} onChangeText={setWordKhm} />
            <TextInput style={styles.input} placeholder="Phiên âm" value={wordPron} onChangeText={setWordPron} />
            <TextInput style={styles.input} placeholder="Nghĩa tiếng Việt" value={wordVie} onChangeText={setWordVie} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setWordModalVisible(false)}><Text style={styles.cancelBtnText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveWord}><Text style={styles.saveBtnText}>Lưu</Text></TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 35, height: 50, position: 'relative' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  addBtnHeader: { position: 'absolute', right: 12, width: 42, height: 42, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  headerTitle: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center', lineHeight: 50 },
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
  vocabCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12, elevation: 1 },
  vocabHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  vocabTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  wordListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordCount: { fontSize: 12, color: '#94a3b8' },
  addWordBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  addWordText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
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
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  modalForm: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b', marginBottom: 5 },
  catRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  catBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeCatBtn: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  catBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  activeCatBtnText: { color: '#fff' },
  saveBtn: { backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnSmall: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
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
});

export default ContentManagement;
