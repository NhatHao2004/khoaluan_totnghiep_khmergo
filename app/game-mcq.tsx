import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

  // Update progress bar
  useEffect(() => {
    if (phase !== 'question') return;
    Animated.timing(progressAnim, {
      toValue: (questionIndex + 1),
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [questionIndex, phase]);

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

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(feedbackOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(feedbackScale, { toValue: 1.1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setIsShowingFeedback(false);
      });
    }, 1500);
  }, []);

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

    // Auto advance after 2.5 seconds
    setTimeout(() => {
      setShowExplanation(false);
      if (isLastQuestion) {
        handleFinish(newResults);
      } else {
        setQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setAnswerState('idle');
      }
    }, 2500);
  };

  const handleFinish = async (finalResults: boolean[]) => {
    const earnedTotal = finalResults.filter(Boolean).length * POINTS_PER_CORRECT;
    setPhase('result');
    if (user && earnedTotal > 0) {
      setIsSaving(true);
      try {
        const added = await updateQuizScore(user.uid, pagodaId as string, earnedTotal);
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
    setPhase('intro');
    setQuestionIndex(0);
    setSelectedOption(null);
    setAnswerState('idle');
    setScore(0);
    setCorrectCount(0);
    setResults([]);
    setShowExplanation(false);
    progressAnim.setValue(0);
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

        <TouchableOpacity style={styles.resultSecondaryBtn} onPress={() => router.back()}>
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
            <View style={[
              styles.scoreContainer,
              isShowingFeedback && (answerState === 'correct' ? styles.scoreFeedbackCorrect : styles.scoreFeedbackWrong)
            ]}>
              {isShowingFeedback ? (
                <Animated.View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  opacity: feedbackOpacity,
                  transform: [{ scale: feedbackScale }]
                }}>
                  <Ionicons
                    name={answerState === 'correct' ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color="#FFF"
                  />
                  <Text style={styles.scoreFeedbackText}>
                    {answerState === 'correct' ? 'Chính xác' : 'Sai rồi'}
                  </Text>
                </Animated.View>
              ) : (
                <>
                  <Text style={[styles.scoreValue, { color: quizData.color }]}>{score}</Text>
                  <Text style={styles.scoreLabel}>Điểm</Text>
                </>
              )}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modern Absolute Feedback Overlay */}
      {isShowingFeedback && (
        <Animated.View style={[
          styles.modernFeedback,
          answerState === 'wrong' && styles.modernFeedbackWrong,
          {
            opacity: feedbackOpacity,
            transform: [{ scale: feedbackScale }]
          }
        ]}>
          <Ionicons
            name={answerState === 'correct' ? 'checkmark-circle' : 'close-circle'}
            size={60}
            color="#FFF"
          />
          <Text style={styles.modernFeedbackText}>
            {answerState === 'correct' ? 'Chính xác' : 'Sai rồi'}
          </Text>
          {currentQuestion?.explanation && (
            <Text style={[styles.modernFeedbackText, { fontSize: 16, fontWeight: '500', marginTop: 12, lineHeight: 20 }]}>
              {currentQuestion.explanation}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Floating Close Button at Bottom Right */}
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Thoát khỏi trò chơi', 'Tiến trình của bạn sẽ không được lưu', [
            { text: 'Tiếp tục', style: 'cancel' },
            { text: 'Thoát', style: 'destructive', onPress: () => router.back() },
          ])
        }
        style={styles.floatingCloseBtn}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={26} color="#FFF" />
      </TouchableOpacity>
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
    width: 110, // Fixed width to prevent jumping
    height: 40, // Fixed height
    justifyContent: 'center',
  },
  scoreFeedbackCorrect: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  scoreFeedbackWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  scoreFeedbackText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  correctMarker: {
    marginLeft: 8,
  },

  // ── FEEDBACK BANNER ──
  modernFeedback: {
    position: 'absolute',
    top: '40%',
    left: 40,
    right: 40,
    backgroundColor: '#22C55E',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 30,
    gap: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
    zIndex: 1000,
  },
  modernFeedbackWrong: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  modernFeedbackText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
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
});
