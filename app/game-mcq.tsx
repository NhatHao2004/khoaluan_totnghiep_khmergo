import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getQuizData, updateQuizScore } from '../services/firebase-service';
import { PAGODA_QUIZZES, PagodaQuizData } from '../utils/quizData';

const { width } = Dimensions.get('window');
const TOTAL_QUESTIONS = 5;
const POINTS_PER_CORRECT = 5;

type Phase = 'intro' | 'question' | 'result';
type AnswerState = 'idle' | 'correct' | 'wrong';

export default function GameMCQScreen() {
  const router = useRouter();
  const { pagodaId, imageUrl, pagodaLocation } = useLocalSearchParams<{ pagodaId: string; imageUrl?: string; pagodaLocation?: string }>();
  const { user, refreshUser } = useAuth();

  const [quizData, setQuizData] = useState<PagodaQuizData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('question');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check login on mount
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setShowLoginModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Fetch Dynamic Quiz Data
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const firestoreData = await getQuizData(pagodaId as string);
        if (firestoreData) {
          setQuizData(firestoreData as PagodaQuizData);
        } else {
          // Fallback to local
          const local = PAGODA_QUIZZES.find(p => p.pagodaId === pagodaId) ?? PAGODA_QUIZZES[0];
          setQuizData(local);
        }
      } catch (e) {
        console.error("Error loading quiz data:", e);
        const local = PAGODA_QUIZZES.find(p => p.pagodaId === pagodaId) ?? PAGODA_QUIZZES[0];
        setQuizData(local);
      } finally {
        setDataLoading(false);
      }
    };
    loadQuiz();
  }, [pagodaId]);

  const heroImage = useMemo(() => {
    // 1. Prioritize dynamic imageUrl from navigation (Firestore Destinations)
    if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }
    // 2. Fallback to local quizData image based on ID
    const localQuiz = PAGODA_QUIZZES.find(p => p.pagodaId === pagodaId);
    return localQuiz?.image;
  }, [imageUrl, pagodaId]);

  const currentQuestion = quizData?.questions[questionIndex];
  const isLastQuestion = questionIndex === TOTAL_QUESTIONS - 1;

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0.5)).current;
  const cardShake = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;
  const slideUp = useRef(new Animated.Value(0)).current;

  // Update progress bar


  const shakeCard = useCallback(() => {
    Animated.sequence([
      Animated.timing(cardShake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(cardShake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(cardShake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(cardShake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(cardShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const showFeedback = useCallback(() => {
    setIsShowingFeedback(true);
    feedbackOpacity.setValue(0);
    feedbackScale.setValue(0.7);
    Animated.parallel([
      Animated.spring(feedbackOpacity, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.spring(feedbackScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
    ]).start();
  }, []);

  const moveToNextQuestion = () => {
    setIsShowingFeedback(false);
    setShowExplanation(false);

    if (isLastQuestion) {
      handleFinish(results);
    } else {
      setQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswerState('idle');

      // Reset these for the next round instantly
      contentFade.setValue(1);
      slideUp.setValue(0);
      feedbackOpacity.setValue(0);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (answerState !== 'idle' || !currentQuestion) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setSelectedOption(optionIndex);
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    setShowExplanation(true);

    const newResults = [...results, isCorrect];
    setResults(newResults);

    if (isCorrect) {
      setScore(prev => prev + POINTS_PER_CORRECT);
      setCorrectCount(prev => prev + 1);
    } else {
      shakeCard();
    }
    showFeedback();

    // Chạy thanh tiến trình ngay khi trả lời xong câu hỏi đó
    Animated.timing(progressAnim, {
      toValue: (questionIndex + 1),
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handleFinish = async (finalResults: boolean[]) => {
    const earnedTotal = finalResults.filter(Boolean).length * POINTS_PER_CORRECT;
    setPhase('result');
    if (user && earnedTotal > 0) {
      setIsSaving(true);
      setHasSaved(false);
      try {
        const actualCorrectCount = finalResults.filter(Boolean).length;
        const isPerfect = actualCorrectCount === TOTAL_QUESTIONS;

        // Chạy song song: lưu điểm và đảm bảo hiện "Đang lưu" ít nhất 1.2s để UX mượt hơn
        const [added] = await Promise.all([
          updateQuizScore(user.uid, pagodaId as string, earnedTotal, isPerfect),
          new Promise(resolve => setTimeout(resolve, 1200))
        ]);

        setEarned(added);
        await refreshUser();
        setHasSaved(true);
      } catch (e) {
        console.error('Error saving score:', e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleReplay = () => {
    setPhase('question');
    setQuestionIndex(0);
    setSelectedOption(null);
    setAnswerState('idle');
    setScore(0);
    setCorrectCount(0);
    setResults([]);
    setShowExplanation(false);
    setHasSaved(false);
    setIsSaving(false);
    progressAnim.setValue(0);
    contentFade.setValue(1);
    slideUp.setValue(0);
  };

  const getOptionStyle = (index: number) => {
    if (!currentQuestion) return styles.option;
    if (answerState === 'idle') return styles.option;
    if (index === currentQuestion.correctIndex) return [styles.option, styles.optionCorrect];
    if (index === selectedOption && !(index === currentQuestion.correctIndex))
      return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  };

  const getOptionLetterStyle = (index: number) => {
    if (!currentQuestion) return styles.optionLetterBox;
    if (answerState === 'idle') return styles.optionLetterBox;
    if (index === currentQuestion.correctIndex)
      return [styles.optionLetterBox, { backgroundColor: '#22C55E' }];
    if (index === selectedOption && index !== currentQuestion.correctIndex)
      return [styles.optionLetterBox, { backgroundColor: '#EF4444' }];
    return [styles.optionLetterBox, { backgroundColor: '#E2E8F0' }];
  };

  if (dataLoading || !quizData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B2C" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>Đang tải câu hỏi...</Text>
      </View>
    );
  }

  // ─────────────── GUEST VIEW ───────────────
  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.guestIconCircle}>
          <Ionicons name="lock-closed" size={50} color="#3B82F6" />
        </View>
        <Text style={styles.guestTitle}>Yêu cầu đăng nhập</Text>
        <Text style={styles.guestSub}>
          Bạn cần đăng nhập để tham gia thử thách,{'\n'}lưu lại thành tích và tích luỹ điểm thưởng.
        </Text>

        <TouchableOpacity
          style={[styles.guestPrimaryBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.guestPrimaryBtnText}>Đăng nhập ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestSecondaryBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.guestSecondaryBtnText}>Để sau, quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, TOTAL_QUESTIONS],
    outputRange: ['0%', '100%'],
  });

  const stars = correctCount;


  // ─────────────── RESULT SCREEN ───────────────
  if (phase === 'result') {
    const displayPoints = correctCount * POINTS_PER_CORRECT;
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle="dark-content" />

        {/* Stars */}
        <View style={styles.resultStarsRow}>
          {[1, 2, 3, 4, 5].map(s => (
            <Ionicons
              key={s}
              name={s <= stars ? 'star' : 'star-outline'}
              size={44}
              color={s <= stars ? '#FBBF24' : '#E2E8F0'}
              style={{ marginHorizontal: 4 }}
            />
          ))}
        </View>

        <Text style={styles.resultTitle}>
          {correctCount === 5 ? '🎉 Xuất sắc' : correctCount === 4 ? '👏 Tốt lắm' : '💪 Cố lên'}
        </Text>

        {/* Score card */}
        <View style={[styles.resultScoreCard, { borderColor: quizData?.color + '40' }]}>
          <View style={styles.resultScoreRow}>
            <Text style={[styles.resultScoreNum, { color: quizData?.color }]}>+{displayPoints}</Text>
            <Text style={styles.resultScoreLabel}>điểm vừa tích luỹ</Text>
          </View>

          {isSaving && <Text style={styles.savingText}>Đang lưu điểm...</Text>}
          {hasSaved && <Text style={styles.savedText}>Đã lưu thành tích</Text>}
        </View>

        <Text style={styles.resultCorrectLabel}>
          Trả lời đúng {correctCount}/{TOTAL_QUESTIONS} câu
        </Text>

        {/* Result dot row */}
        <View style={styles.resultDotRow}>
          {results.map((r, i) => (
            <View
              key={i}
              style={[styles.resultDot, r ? styles.resultDotGreen : styles.resultDotRed]}
            >
              <Ionicons name={r ? 'checkmark' : 'close'} size={12} color="#FFF" />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.resultPrimaryBtn, { backgroundColor: quizData.color }]}
          onPress={handleReplay}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.resultPrimaryBtnText}>Chơi lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resultSecondaryBtn}
          onPress={() => {
            if (pagodaId?.startsWith('culture_')) {
              router.replace('/quiz-culture');
            } else if (pagodaId?.startsWith('food_')) {
              router.replace('/food');
            } else {
              router.replace('/quiz-pagoda');
            }
          }}
        >
          <Text style={styles.resultSecondaryBtnText}>Chọn bộ câu hỏi khác</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────── QUESTION SCREEN ───────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Decorative background circle */}
      <View style={[styles.bgCircle, { backgroundColor: quizData.color + '05' }]} />

      {/* Modern Header - Remove Close button here */}
      <View style={styles.headerContainer}>
        <View style={styles.headerInfo}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Câu {questionIndex + 1} / {TOTAL_QUESTIONS}</Text>
            <View style={styles.scorePill}>
              <Ionicons name="flash" size={16} color="#F59E0B" />
              <Text style={styles.scorePillText}>{score}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressBarWidth, backgroundColor: quizData.color },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: contentFade,
          transform: [{ translateY: slideUp }]
        }}>
          {/* Dot Indicators - Floating style */}
          <View style={styles.modernDotRow}>
            {quizData.questions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.modernDot,
                  i < questionIndex
                    ? results[i]
                      ? styles.modernDotCorrect
                      : styles.modernDotWrong
                    : i === questionIndex
                      ? [styles.modernDotActive, { backgroundColor: quizData.color }]
                      : styles.modernDotEmpty,
                ]}
              />
            ))}
          </View>

          {/* Question Area */}
          <Animated.View
            style={[styles.mainCard, { transform: [{ translateX: cardShake }] }]}
          >
            <Text style={styles.mainQuestionText}>
              {currentQuestion?.question}
            </Text>
          </Animated.View>

          {/* Options Area */}
          <View style={styles.optionsArea}>
            {currentQuestion?.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                activeOpacity={0.8}
                onPress={() => handleAnswer(index)}
                disabled={answerState !== 'idle'}
              >
                <View style={getOptionLetterStyle(index)}>
                  {answerState !== 'idle' && index === currentQuestion?.correctIndex ? (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  ) : answerState !== 'idle' && index === selectedOption && index !== currentQuestion.correctIndex ? (
                    <Ionicons name="close" size={16} color="#FFF" />
                  ) : (
                    <Text style={[
                      styles.optLetter,
                      answerState !== 'idle' && index === currentQuestion.correctIndex ? { color: '#FFF' } : {}
                    ]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  )}
                </View>
                <Text style={styles.optText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* New Bottom Feedback UI */}
      {isShowingFeedback && (
        <View style={styles.feedbackBottomWrapper}>
          <View style={[
            styles.feedbackBottomCard,
            answerState === 'wrong' && styles.feedbackBottomCardWrong,
          ]}>
            <View style={styles.feedbackHeaderRow}>
              <View style={[styles.statusIconCircle, answerState === 'wrong' && styles.statusIconCircleWrong]}>
                <Ionicons
                  name={answerState === 'correct' ? 'checkmark' : 'close'}
                  size={24}
                  color="#FFF"
                />
              </View>
              <Text style={[styles.statusText, answerState === 'wrong' && styles.statusTextWrong]}>
                {answerState === 'correct' ? 'Tuyệt vời' : 'Chưa chính xác'}
              </Text>
            </View>

            {currentQuestion?.explanation && (
              <ScrollView
                style={styles.explScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Text style={[styles.explTextNew, answerState === 'wrong' && styles.explTextNewWrong]}>
                  {currentQuestion.explanation}
                </Text>
              </ScrollView>
            )}

            <View style={styles.correctAnswerBox}>
              <Text style={[styles.correctAnswerLabel, answerState === 'wrong' && styles.correctAnswerLabelWrong]}>
                Đáp án đúng
              </Text>
              <Text style={[styles.correctAnswerText, answerState === 'wrong' && styles.correctAnswerTextWrong]}>
                {currentQuestion?.options[currentQuestion.correctIndex]}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.nextBtnNew, answerState === 'wrong' && styles.nextBtnNewWrong]}
              onPress={moveToNextQuestion}
              activeOpacity={0.9}
            >
              <Text style={styles.nextBtnTextNew}>Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating Close Button at Bottom Right */}
      <TouchableOpacity
        onPress={() => setShowExitModal(true)}
        style={styles.floatingCloseBtn}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={26} color="#FFF" />
      </TouchableOpacity>

      {/* Custom Exit Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exitModalContent}>
            <View style={styles.exitIconCircle}>
              <Ionicons name="exit-outline" size={40} color="#EF4444" />
            </View>
            <Text style={styles.exitTitle}>Thoát khỏi trò chơi</Text>
            <Text style={styles.exitSub}>Tiến trình hiện tại của bạn sẽ{'\n'}không được lưu lại</Text>

            <View style={styles.exitActionRow}>
              <TouchableOpacity
                style={styles.stayBtn}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={styles.stayBtnText}>Tiếp tục chơi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmExitBtn}
                onPress={() => {
                  setShowExitModal(false);
                  router.back();
                }}
              >
                <Text style={styles.confirmExitBtnText}>Thoát</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exitModalContent}>
            <View style={[styles.exitIconCircle, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
              <Ionicons name="person-circle-outline" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.exitTitle}>Bạn chưa đăng nhập</Text>
            <Text style={styles.exitSub}>Hãy đăng nhập để lưu lại thành tích{'\n'}và tích luỹ điểm thưởng nhé!</Text>
            
            <View style={styles.exitActionRow}>
              <TouchableOpacity 
                style={styles.stayBtn}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/login');
                }}
              >
                <Text style={styles.stayBtnText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmExitBtn}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.confirmExitBtnText}>Để sau</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  bgCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: 0,
  },

  // ── MODERN HEADER ──
  headerContainer: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: 120, // Fixed height
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 5,
    zIndex: 10,
  },
  floatingCloseBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'stretch',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  progressContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressTrack: {
    flex: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  scorePillText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
  },

  // ── SCROLL CONTENT ──
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    flexGrow: 1,
  },

  // ── MODERN DOTS ──
  modernDotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  modernDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modernDotEmpty: {
    backgroundColor: '#CBD5E1',
    width: 6,
    height: 6,
  },
  modernDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  modernDotCorrect: {
    backgroundColor: '#22C55E',
  },
  modernDotWrong: {
    backgroundColor: '#EF4444',
  },

  // ── MAIN QUESTION CARD ──
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  mainQuestionText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 32,
    textAlign: 'center',
  },
  modernExplBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modernExplCorrect: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  modernExplWrong: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  modernExplText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'justify',
  },

  // ── OPTIONS AREA ──
  optionsArea: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionDimmed: {
    opacity: 0.5,
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  optionLetterBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: '#64748B',
  },
  optText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  correctMarker: {
    marginLeft: 8,
  },

  // --- New Bottom Feedback Styles ---
  feedbackBottomWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 2000,
  },
  feedbackBottomCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 36,
    width: '100%',
    maxWidth: 350,
    padding: 30,
    borderWidth: 2,
    borderColor: '#DCFCE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  feedbackBottomCardWrong: {
    backgroundColor: '#FEF2F2', // Light red
    borderColor: '#FEE2E2',
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconCircleWrong: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#166534',
  },
  statusTextWrong: {
    color: '#991B1B',
  },
  explScroll: {
    maxHeight: 140,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E293B',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 15,
    marginTop: 5,
  },
  explTextNew: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
  },
  explTextNewWrong: {
    color: '#334155',
  },
  nextBtnNew: {
    backgroundColor: '#22C55E',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnNewWrong: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  nextBtnTextNew: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  correctAnswerBox: {
    marginBottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 0,
  },
  correctAnswerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  correctAnswerLabelWrong: {
    color: '#64748B',
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
  },
  correctAnswerTextWrong: {
    color: '#1E293B',
  },

  // ── RESULT SCREEN ──
  resultStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: { fontSize: 26, fontWeight: '900', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  resultScoreCard: {
    width: '100%', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 24, padding: 24, borderWidth: 2, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  resultScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  resultScoreNum: { fontSize: 52, fontWeight: '900' },
  resultScoreLabel: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  savingText: { fontSize: 12, color: '#94A3B8', marginTop: 6 },
  savedText: { fontSize: 12, color: '#22C55E', fontWeight: '700', marginTop: 6 },
  resultCorrectLabel: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  resultDotRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  resultDot: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  resultDotGreen: { backgroundColor: '#22C55E' },
  resultDotRed: { backgroundColor: '#EF4444' },
  resultPrimaryBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 18, marginBottom: 12,
  },
  resultPrimaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  resultSecondaryBtn: {
    paddingVertical: 12,
  },
  resultSecondaryBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exitModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  exitIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingLeft: 7,
  },
  exitTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  exitSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  exitActionRow: {
    width: '100%',
    gap: 12,
  },
  stayBtn: {
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  stayBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmExitBtn: {
    backgroundColor: '#EF4444',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  confirmExitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // --- Guest View Styles ---
  guestIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  guestPrimaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  guestPrimaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  guestSecondaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  guestSecondaryBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
  },
});
