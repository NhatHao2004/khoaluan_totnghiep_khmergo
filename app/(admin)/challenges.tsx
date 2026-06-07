import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../utils/firebaseConfig';

const ChallengeManagement = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pagoda' | 'culture' | 'food'>('pagoda');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [managingQuizId, setManagingQuizId] = useState<string | null>(null);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);

  // Quiz Form State
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [qTitle, setQTitle] = useState('');
  const [qTitleKm, setQTitleKm] = useState('');
  const [qColor, setQColor] = useState('#3b82f6');
  const [qPagodaId, setQPagodaId] = useState('');

  // Question Form State
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questText, setQuestText] = useState('');
  const [questTextKm, setQuestTextKm] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [optionsKm, setOptionsKm] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const translateY = useRef(new Animated.Value(-100)).current;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message: msg, type });
    Animated.spring(translateY, {
      toValue: 35,
      useNativeDriver: true,
      tension: 10,
      friction: 5
    }).start();

    setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true
      }).start(() => setToast({ ...toast, visible: false }));
    }, 3000);
  };

  useEffect(() => {
    setLoading(true);
    // Fetch Quizzes
    const qQuiz = query(collection(db, 'quizzes'));
    const unsubQuiz = onSnapshot(qQuiz, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuizzes(data);
    });

    // Fetch Destinations (to link quizzes)
    const qDest = query(collection(db, 'destinations'));
    const unsubDest = onSnapshot(qDest, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDestinations(data);
      setLoading(false);
    });

    return () => {
      unsubQuiz();
      unsubDest();
    };
  }, []);

  const filteredQuizzes = quizzes.filter(q => {
    const id = q.id || '';
    const isCulture = id.startsWith('culture_');
    const isFood = id.startsWith('food_');
    const isPagoda = !isCulture && !isFood;

    const matchesTab = (activeTab === 'pagoda' && isPagoda) ||
      (activeTab === 'culture' && isCulture) ||
      (activeTab === 'food' && isFood);

    const matchesSearch = (q.pagodaName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.pagodaNameKm || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSaveQuiz = async () => {
    if (!qTitle || !qPagodaId) {
      showToast('Vui lòng điền đủ thông tin', 'error');
      return;
    }

    const quizData = {
      pagodaName: qTitle,
      pagodaNameKm: qTitleKm || qTitle,
      pagodaId: qPagodaId,
      color: qColor,
      updatedAt: new Date(),
    };

    try {
      if (editingQuiz) {
        await updateDoc(doc(db, 'quizzes', editingQuiz.id), quizData);
        showToast('Cập nhật thử thách thành công');
      } else {
        const newId = qPagodaId; // Use pagodaId as document ID for easy matching
        await setDoc(doc(db, 'quizzes', newId), {
          ...quizData,
          id: newId,
          questions: [],
          createdAt: new Date(),
        });
        showToast('Thêm thử thách mới thành công');
      }
      setQuizModalVisible(false);
      resetQuizForm();
    } catch (error) {
      showToast('Lỗi khi lưu dữ liệu', 'error');
    }
  };

  const resetQuizForm = () => {
    setEditingQuiz(null);
    setQTitle('');
    setQTitleKm('');
    setQColor('#3b82f6');
    setQPagodaId('');
  };

  const handleSaveQuestion = async () => {
    if (!managingQuizId || !questText || options.some(o => !o)) {
      showToast('Vui lòng điền đủ câu hỏi và 4 đáp án', 'error');
      return;
    }

    const questionData = {
      id: editingQuestion?.id || Date.now().toString(),
      question: questText,
      questionKm: questTextKm || questText,
      options: options,
      optionsKm: optionsKm,
      correctIndex: correctIndex,
      explanation: explanation
    };

    try {
      const quizRef = doc(db, 'quizzes', managingQuizId);
      if (editingQuestion) {
        // Update local state is safer than double hitting Firestore
        const currentQuiz = quizzes.find(q => q.id === managingQuizId);
        const newQuestions = currentQuiz.questions.map((q: any) => q.id === editingQuestion.id ? questionData : q);
        await updateDoc(quizRef, { questions: newQuestions });
      } else {
        await updateDoc(quizRef, {
          questions: arrayUnion(questionData)
        });
      }
      showToast('Lưu câu hỏi thành công');
      setQuestionModalVisible(false);
      resetQuestionForm();
    } catch (error) {
      showToast('Lỗi khi lưu câu hỏi', 'error');
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestText('');
    setQuestTextKm('');
    setOptions(['', '', '', '']);
    setOptionsKm(['', '', '', '']);
    setCorrectIndex(0);
    setExplanation('');
  };

  const deleteQuiz = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa bộ thử thách này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'quizzes', id));
          showToast('Đã xóa bộ thử thách');
        }
      }
    ]);
  };

  const deleteQuestion = (quizId: string, question: any) => {
    Alert.alert('Xác nhận', 'Xóa câu hỏi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await updateDoc(doc(db, 'quizzes', quizId), {
            questions: arrayRemove(question)
          });
          showToast('Đã xóa câu hỏi');
        }
      }
    ]);
  };

  const getQuizDisplayTitle = (item: any) => {
    if (item.pagodaName) return item.pagodaName;
    if (item.title) return item.title;

    const linkedDest = destinations.find(d => d.id === (item.pagodaId || item.id));
    if (linkedDest) return linkedDest.name;

    return item.id;
  };

  const renderQuizItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => setManagingQuizId(item.id)}
    >
      <View style={styles.quizInfo}>
        <Text style={styles.quizTitle}>{getQuizDisplayTitle(item)}</Text>
        <View style={styles.quizMeta}>
          <Text style={styles.metaText}>{item.questions?.length || 0} câu hỏi</Text>
        </View>
      </View>
      <View style={styles.quizActions}>
        <TouchableOpacity
          style={styles.actionIcon}
          onPress={() => {
            setEditingQuiz(item);
            setQTitle(getQuizDisplayTitle(item));
            const linkedDest = destinations.find(d => d.id === (item.pagodaId || item.id));
            setQTitleKm(item.pagodaNameKm || linkedDest?.name_khmer || '');
            setQColor(item.color);
            setQPagodaId(item.pagodaId);
            setQuizModalVisible(true);
          }}
        >
          <Ionicons name="pencil" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionIcon}
          onPress={() => deleteQuiz(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const managingQuiz = quizzes.find(q => q.id === managingQuizId);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Thử thách</Text>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => {
            resetQuizForm();
            setQuizModalVisible(true);
          }}
        >
          <Ionicons name="add" size={30} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pagoda' && styles.activeTab]}
          onPress={() => setActiveTab('pagoda')}
        >
          <Text style={[styles.tabText, activeTab === 'pagoda' && styles.activeTabText]}>Chùa Khmer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'culture' && styles.activeTab]}
          onPress={() => setActiveTab('culture')}
        >
          <Text style={[styles.tabText, activeTab === 'culture' && styles.activeTabText]}>Văn hóa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'food' && styles.activeTab]}
          onPress={() => setActiveTab('food')}
        >
          <Text style={[styles.tabText, activeTab === 'food' && styles.activeTabText]}>Ẩm thực</Text>
        </TouchableOpacity>
      </View>


      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredQuizzes}
          keyExtractor={item => item.id}
          renderItem={renderQuizItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={60} color="#e2e8f0" />
              <Text style={styles.emptyText}>Chưa có bộ câu hỏi nào</Text>
            </View>
          }
        />
      )}

      {/* --- Quiz Management Modal (Questions) --- */}
      <Modal visible={!!managingQuizId} animationType="slide" statusBarTranslucent={true}>
        <View style={[styles.container, { paddingTop: 35 }]}>
          <View style={styles.modalHeaderFixed}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setManagingQuizId(null)}>
              <Ionicons name="arrow-back" size={28} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{managingQuiz ? getQuizDisplayTitle(managingQuiz) : ''}</Text>
            <TouchableOpacity
              style={styles.addBtnHeader}
              onPress={() => {
                resetQuestionForm();
                setQuestionModalVisible(true);
              }}
            >
              <Ionicons name="add" size={30} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={managingQuiz?.questions || []}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item, index }) => (
              <View style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionIndex}>Câu {index + 1}</Text>
                  <View style={styles.questionActions}>
                    <TouchableOpacity onPress={() => {
                      setEditingQuestion(item);
                      setQuestText(item.question);
                      setQuestTextKm(item.questionKm);
                      setOptions(item.options);
                      setOptionsKm(item.optionsKm || ['', '', '', '']);
                      setCorrectIndex(item.correctIndex);
                      setExplanation(item.explanation || '');
                      setQuestionModalVisible(true);
                    }}>
                      <Ionicons name="pencil" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteQuestion(managingQuizId!, item)}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.questionText}>{item.question}</Text>
                <View style={styles.optionsList}>
                  {item.options.map((opt: string, i: number) => (
                    <View key={i} style={[styles.optionItem, i === item.correctIndex && styles.correctOption]}>
                      <Text style={[styles.optionText, i === item.correctIndex && styles.correctOptionText]}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có câu hỏi nào</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* --- Add/Edit Quiz Modal --- */}
      <Modal visible={quizModalVisible} animationType="fade" transparent statusBarTranslucent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>{editingQuiz ? 'Sửa Thử thách' : 'Thêm Thử thách'}</Text>

            <Text style={styles.inputLabel}>Tên tiếng Việt</Text>
            <TextInput
              style={styles.input}
              value={qTitle}
              onChangeText={setQTitle}
              placeholder="Nhập tên thử thách..."
            />

            <Text style={styles.inputLabel}>Tên tiếng Khmer</Text>
            <TextInput
              style={styles.input}
              value={qTitleKm}
              onChangeText={setQTitleKm}
              placeholder="Nhập tên Khmer..."
            />

            {!editingQuiz && (
              <>
                <Text style={styles.inputLabel}>Liên kết Địa điểm (ID)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {destinations
                    .filter(d => {
                      if (editingQuiz && (editingQuiz.pagodaId === d.id || editingQuiz.id === d.id)) return true;
                      return !quizzes.some(q => q.pagodaId === d.id || q.id === d.id);
                    })
                    .map(d => (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.destChip, qPagodaId === d.id && styles.activeDestChip]}
                        onPress={() => {
                          setQPagodaId(d.id);
                          if (!qTitle) setQTitle(d.name);
                          if (!qTitleKm) setQTitleKm(d.name_khmer);
                        }}
                      >
                        <Text style={[styles.destChipText, qPagodaId === d.id && styles.activeDestChipText]}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </>
            )}


            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setQuizModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveQuiz}>
                <Text style={styles.saveBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Add/Edit Question Modal --- */}
      <Modal visible={questionModalVisible} animationType="slide" statusBarTranslucent={true}>
        <View style={[styles.container, { paddingTop: 35 }]}>
          <View style={styles.modalHeaderFixed}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setQuestionModalVisible(false)}>
              <Ionicons name="close" size={28} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</Text>
            <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveQuestion}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.inputLabel}>Nội dung câu hỏi (VIE)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              value={questText}
              onChangeText={setQuestText}
              placeholder="Nhập câu hỏi..."
            />

            <Text style={styles.inputLabel}>Nội dung câu hỏi (KMR)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              value={questTextKm}
              onChangeText={setQuestTextKm}
              placeholder="Nhập câu hỏi Khmer..."
            />

            <Text style={styles.inputLabel}>Các đáp án (Nhấn chọn đáp án đúng)</Text>
            {options.map((opt, i) => (
              <View key={i} style={styles.optionInputRow}>
                <TouchableOpacity
                  style={[styles.correctIndicator, correctIndex === i && styles.correctIndicatorActive]}
                  onPress={() => setCorrectIndex(i)}
                >
                  <Text style={[styles.indicatorText, correctIndex === i && styles.indicatorTextActive]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { marginBottom: 5 }]}
                    value={opt}
                    onChangeText={(val) => {
                      const newOpts = [...options];
                      newOpts[i] = val;
                      setOptions(newOpts);
                    }}
                    placeholder={`Đáp án ${String.fromCharCode(65 + i)} (VIE)`}
                  />
                  <TextInput
                    style={styles.input}
                    value={optionsKm[i]}
                    onChangeText={(val) => {
                      const newOpts = [...optionsKm];
                      newOpts[i] = val;
                      setOptionsKm(newOpts);
                    }}
                    placeholder={`Đáp án ${String.fromCharCode(65 + i)} (KMR)`}
                  />
                </View>
              </View>
            ))}

            <Text style={styles.inputLabel}>Giải thích đáp án</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              value={explanation}
              onChangeText={setExplanation}
              placeholder="Nhập giải thích vì sao đáp án này đúng..."
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast.visible && (
        <Animated.View style={[styles.toastContainer, toast.type === 'error' ? styles.toastError : styles.toastSuccess, { transform: [{ translateY }] }]}>
          <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 35, height: 60, position: 'relative' },
  modalHeaderFixed: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 60, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  addBtnHeader: { width: 42, height: 42, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowOpacity: 0.1 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#3b82f6' },
  searchSection: { paddingHorizontal: 16, marginTop: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 45 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1e293b' },
  listContent: { padding: 16 },
  quizCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: '#f1f5f9' },
  colorIndicator: { width: 6, height: 40, borderRadius: 3, marginRight: 15 },
  quizInfo: { flex: 1 },
  quizTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  quizSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  quizMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  quizActions: { flexDirection: 'row', gap: 5 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { fontSize: 15, color: '#64748b', marginTop: 10, fontWeight: '600' },
  // Modal Full Screen Question Styles
  questionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionIndex: { fontSize: 14, fontWeight: '900', color: '#3b82f6', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  questionActions: { flexDirection: 'row', gap: 12 },
  questionText: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 15 },
  optionsList: { gap: 8 },
  optionItem: { padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  correctOption: { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
  optionText: { fontSize: 14, color: '#475569' },
  correctOptionText: { color: '#166534', fontWeight: '700' },
  // Form Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentSmall: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b' },
  destChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  activeDestChip: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  destChipText: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  activeDestChipText: { color: '#fff' },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 5 },
  colorBox: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  activeColorBox: { borderColor: '#1e293b' },
  modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 25 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center' },
  cancelBtnText: { color: '#ffffff', fontWeight: '700' },
  saveBtnSmall: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800' },
  // Question Form Specific
  formScroll: { flex: 1 },
  optionInputRow: { flexDirection: 'row', gap: 10, marginBottom: 15, alignItems: 'flex-start' },
  correctIndicator: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 5 },
  correctIndicatorActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  indicatorText: { fontSize: 16, fontWeight: '900', color: '#64748b' },
  indicatorTextActive: { color: '#fff' },
  // Toast Styles
  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, zIndex: 9999, gap: 12 },
  toastSuccess: { backgroundColor: '#10b981' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});

export default ChallengeManagement;
