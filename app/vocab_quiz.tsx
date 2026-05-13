import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const POINTS_PER_WORD = 5;

// Mock images mapping for vocabulary categories/words
const WORD_IMAGES: Record<string, any> = {
    'g1': require('@/assets/images/pagoda.jpg'),
    'fo1': require('@/assets/images/monan.jpg'),
    'fo8': require('@/assets/images/monan.jpg'),
    'default': require('@/assets/images/hoctap.jpg'),
};

type GameState = 'selection' | 'playing' | 'results';

export default function VocabQuizScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { user, refreshUser } = useAuth();

    const [gameState, setGameState] = useState<GameState>('selection');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [score, setScore] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [questionResults, setQuestionResults] = useState<boolean[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Fetch categories from Firebase
    useEffect(() => {
        const q = query(collection(db, 'vocab_categories'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCategories(cats);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Generate quiz questions based on selected category
    const quizWords = useMemo(() => {
        if (!selectedCategory || categories.length === 0) return [];
        const category = categories.find(c => c.id === selectedCategory);
        if (!category || !category.words) return [];

        // Return the first 8 words as requested
        return [...category.words].slice(0, 8);
    }, [selectedCategory, categories]);

    const totalQuestions = quizWords.length || 0;
    const currentWord = quizWords[questionIndex];

    // Options for current question
    const currentOptions = useMemo(() => {
        if (!currentWord || !selectedCategory || categories.length === 0) return [];
        const category = categories.find(c => c.id === selectedCategory);
        if (!category || !category.words) return [];

        // Take distractors only from the SAME category to maintain context
        const allOtherWordsInCat = category.words.filter((w: any) => w.id !== currentWord.id);
        const distractors = [...allOtherWordsInCat].sort(() => 0.5 - Math.random()).slice(0, 3);

        // Shuffle only the 4 options for the current question
        return [...distractors, currentWord].sort(() => 0.5 - Math.random());
    }, [currentWord, selectedCategory, categories]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current; // For sliding questions
    const feedbackScale = useRef(new Animated.Value(0)).current;
    const cardShake = useRef(new Animated.Value(0)).current;

    const shakeAnimation = () => {
        Animated.sequence([
            Animated.timing(cardShake, { toValue: 15, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: -15, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // Smooth background color animations for each option (4 options max)
    const optionFeedbackAnims = useRef([
        new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)
    ]).current;

    const handleAnswer = (index: number) => {
        if (answerState !== 'idle') return;

        const isCorrect = currentOptions[index].id === currentWord.id;
        setSelectedOption(index);
        setAnswerState(isCorrect ? 'correct' : 'wrong');
        setQuestionResults(prev => [...prev, isCorrect]);

        // Animate backgrounds smoothly
        const animations = currentOptions.map((opt, i) => {
            const isOptSelected = i === index;
            const isOptCorrect = opt.id === currentWord.id;

            if (isOptCorrect || (isOptSelected && !isOptCorrect)) {
                return Animated.timing(optionFeedbackAnims[i], {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true
                });
            }
            return null;
        }).filter(a => a !== null) as Animated.CompositeAnimation[];

        Animated.parallel([
            ...animations,
            Animated.spring(feedbackScale, {
                toValue: 1,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start();

        if (isCorrect) {
            setScore(prev => prev + POINTS_PER_WORD);
            setCorrectAnswers(prev => prev + 1);
            Vibration.vibrate(50);
        } else {
            shakeAnimation();
            Vibration.vibrate(100);
        }

        setTimeout(() => {
            if (questionIndex < totalQuestions - 1) {
                // Hyper-Smooth Spring Transition
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.timing(slideAnim, { toValue: -30, duration: 350, useNativeDriver: true })
                ]).start(() => {
                    setQuestionIndex(prev => prev + 1);
                    setAnswerState('idle');
                    setSelectedOption(null);
                    feedbackScale.setValue(0);
                    optionFeedbackAnims.forEach(anim => anim.setValue(0));
                    slideAnim.setValue(50);

                    Animated.parallel([
                        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.spring(slideAnim, {
                            toValue: 0,
                            tension: 50,
                            friction: 9,
                            useNativeDriver: true
                        })
                    ]).start();
                });
            } else {
                setGameState('results');
            }
        }, 1600);
    };

    const resetGame = () => {
        setGameState('selection');
        setSelectedCategory(null);
        setQuestionIndex(0);
        setScore(0);
        setCorrectAnswers(0);
        setQuestionResults([]);
        setAnswerState('idle');
        setSelectedOption(null);
        feedbackScale.setValue(0);
        optionFeedbackAnims.forEach(anim => anim.setValue(0));
    };

    const handleReplay = () => {
        setGameState('playing');
        setQuestionIndex(0);
        setScore(0);
        setCorrectAnswers(0);
        setQuestionResults([]);
        setAnswerState('idle');
        setSelectedOption(null);
        feedbackScale.setValue(0);
        optionFeedbackAnims.forEach(anim => anim.setValue(0));
    };

    const handleFinish = async () => {
        if (user && score > 0 && !hasSaved) {
            setIsSaving(true);
            try {
                const { updateQuizScore } = await import('@/services/firebase-service');
                await updateQuizScore(user.uid, 'vocab_master', score);
                await refreshUser();
                setHasSaved(true);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSaving(false);
            }
        }
        router.back();
    };


    if (gameState === 'selection') {
        return (
            <View style={styles.container}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={28} color="#000000" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
                                {t('vocab_quiz')}
                            </ThemedText>
                        </View>

                        <View style={{ width: 50 }} />
                    </View>

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={{ paddingBottom: 0 }}
                        showsVerticalScrollIndicator={false}
                    >

                        <View style={styles.categoryList}>
                            {categories.map((category, index) => (
                                <View key={category.id || index} style={styles.categoryMainCard}>
                                    {/* Proxy Image Container */}
                                    <View style={styles.categoryImageContainer}>
                                        <Image
                                            source={[
                                                require('@/assets/images/giadinh.jpg'),
                                                require('@/assets/images/monan.jpg'),
                                                require('@/assets/images/chaohoi.jpg'),
                                                require('@/assets/images/sodem.jpg'),
                                            ][index % 4]}
                                            style={styles.categoryCardImage}
                                            contentFit="contain"
                                        />
                                    </View>

                                    {/* Content */}
                                    <View style={styles.categoryCardBody}>
                                        <Text style={styles.categoryCardTitle}>{t(category.title)}</Text>
                                        <Text style={styles.categoryCardSub}>{Math.min(8, category.words?.length || 0)} {t('vocab_challenge_questions')}</Text>

                                        {/* Quiz footer */}
                                        <View style={styles.quizSelectionFooter}>
                                            <View style={styles.quizInfoBox}>
                                                <Text style={styles.quizInfoLabel}>{t('correct_answer_points_msg')}</Text>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.startQuizBtn}
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    if (!user) {
                                                        Alert.alert(
                                                            t('login_required'),
                                                            t('login_required_long_msg'),
                                                            [
                                                                { text: t('cancel'), style: 'cancel' },
                                                                { text: t('login'), onPress: () => router.push('/login') },
                                                            ]
                                                        );
                                                        return;
                                                    }
                                                    setSelectedCategory(category.id);
                                                    setGameState('playing');
                                                }}
                                            >
                                                <Text style={styles.startQuizBtnText}>{t('start_quiz')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    if (gameState === 'results') {
        const stars = Math.ceil((correctAnswers / totalQuestions) * 5);
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        return (
            <View style={styles.resultsContainer}>
                <LinearGradient colors={['#F5F3FF', '#FFF', '#F5F3FF']} style={StyleSheet.absoluteFill} />
                <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 }}>

                    {/* Stars Row */}
                    <View style={styles.resultStarsRow}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Ionicons
                                key={s}
                                name={s <= stars ? 'star' : 'star-outline'}
                                size={48}
                                color={s <= stars ? '#FBBF24' : '#E2E8F0'}
                                style={{ marginHorizontal: 4 }}
                            />
                        ))}
                    </View>

                    <Text style={styles.resultTitle}>
                        {percentage === 100 ? t('excellent') : percentage >= 80 ? t('well_done') : t('keep_it_up')}
                    </Text>

                    {/* Score card */}
                    <View style={styles.resultScoreCard}>
                        <View style={styles.resultScoreRow}>
                            <Text style={styles.resultScoreNum}>+{score}</Text>
                            <Text style={styles.resultScoreLabel}>{t('points_earned')}</Text>
                        </View>
                        {isSaving && <Text style={styles.savingText}>{t('saving_results')}</Text>}
                    </View>

                    <Text style={styles.resultCorrectLabel}>
                        {t('answered_correctly')} {correctAnswers}/{totalQuestions} {t('questions_count')}
                    </Text>

                    {/* Result dot row */}
                    <View style={styles.resultDotRow}>
                        {questionResults.map((r, i) => (
                            <View
                                key={i}
                                style={[styles.resultDot, r ? styles.resultDotGreen : styles.resultDotRed]}
                            >
                                <Ionicons name={r ? 'checkmark' : 'close'} size={12} color="#FFF" />
                            </View>
                        ))}
                    </View>

                    <View style={styles.resultActionBox}>
                        <TouchableOpacity
                            style={styles.resultPrimaryBtn}
                            onPress={handleReplay}
                        >
                            <Ionicons name="refresh" size={20} color="#FFF" />
                            <Text style={styles.resultPrimaryBtnText}>{t('replay')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.resultSecondaryBtn} onPress={resetGame}>
                            <Text style={styles.resultSecondaryBtnText}>{t('choose_another_quiz')}</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Decorative background circle */}
            <View style={[styles.bgCircle, { backgroundColor: '#7C3AED05' }]} />

            {/* Modern Header Style */}
            <View style={styles.headerContainer}>
                <View style={styles.headerInfo}>
                    <View style={styles.headerTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() =>
                                    Alert.alert(t('exit_game_title'), t('exit_game_msg'), [
                                        { text: t('continue'), style: 'cancel' },
                                        { text: t('exit'), style: 'destructive', onPress: resetGame },
                                    ])
                                }
                                style={styles.headerCloseBtn}
                            >
                                <Ionicons name="arrow-back" size={28} color="#1E293B" />
                            </TouchableOpacity>
                            <Text style={styles.gameHeaderTitle}>{t('question').toUpperCase()} {questionIndex + 1} / {totalQuestions}</Text>
                        </View>

                        <View style={styles.scorePill}>
                            <Ionicons name="flash" size={16} color="#F59E0B" />
                            <Text style={styles.scorePillText}>{score}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.gameBody}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Premium Card Stage */}
                <Animated.View style={[
                    styles.mainCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { translateX: cardShake }
                        ]
                    }
                ]}>
                    <Image
                        source={currentWord?.imageUrl ? { uri: currentWord.imageUrl } : (WORD_IMAGES[currentWord?.id] || WORD_IMAGES['default'])}
                        style={styles.mainCardImage}
                        contentFit="contain"
                    />
                </Animated.View>

                {/* Options Area */}
                <View style={styles.optionsArea}>
                    {currentOptions.map((option, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = option.id === currentWord.id;
                        const letter = ['A', 'B', 'C', 'D'][i];

                        // Dynamic Style Logic
                        const getOptionStyle = () => {
                            if (answerState === 'idle') return styles.optBtn;
                            if (isCorrect) return [styles.optBtn, styles.optBtnCorrect];
                            if (isSelected && !isCorrect) return [styles.optBtn, styles.optBtnWrong];
                            return [styles.optBtn, { opacity: 0.5 }];
                        };

                        const getLetterStyle = () => {
                            if (answerState === 'idle') return styles.optLetterBox;
                            if (isCorrect || isSelected) return [styles.optLetterBox, { backgroundColor: '#FFF' }];
                            return styles.optLetterBox;
                        };

                        return (
                            <TouchableOpacity
                                key={i}
                                activeOpacity={0.8}
                                onPress={() => handleAnswer(i)}
                                disabled={answerState !== 'idle'}
                                style={getOptionStyle()}
                            >
                                <View style={getLetterStyle()}>
                                    {answerState !== 'idle' && isCorrect ? (
                                        <Ionicons name="checkmark" size={18} color="#22C55E" />
                                    ) : answerState !== 'idle' && isSelected && !isCorrect ? (
                                        <Ionicons name="close" size={18} color="#EF4444" />
                                    ) : (
                                        <Text style={[
                                            styles.optLetterText,
                                            (answerState !== 'idle' && (isCorrect || isSelected)) && { color: isCorrect ? '#22C55E' : '#EF4444' }
                                        ]}>
                                            {letter}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.optContent}>
                                    <Text style={[
                                        styles.optTextKhm,
                                        (answerState !== 'idle' && isCorrect) && { color: '#FFF' },
                                        (answerState !== 'idle' && isSelected && !isCorrect) && { color: '#EF4444' }
                                    ]}>
                                        {option.khm} <Text style={[
                                            styles.optTextVie,
                                            (answerState !== 'idle' && isCorrect) && { color: 'rgba(255,255,255,0.9)' },
                                            (answerState !== 'idle' && isSelected && !isCorrect) && { color: 'rgba(239, 68, 68, 0.8)' }
                                        ]}>({option.vie})</Text>
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modern Absolute Feedback Overlay */}
            {answerState !== 'idle' && (
                <Animated.View style={[
                    styles.modernFeedback,
                    answerState === 'wrong' && styles.modernFeedbackWrong,
                    {
                        transform: [{ scale: feedbackScale }],
                        opacity: feedbackScale // Simple fade with scale
                    }
                ]}>
                    <View style={styles.feedbackIconCircle}>
                        <Ionicons
                            name={answerState === 'correct' ? 'checkmark-circle' : 'close-circle'}
                            size={80}
                            color="#FFF"
                        />
                    </View>
                    <Text style={styles.modernFeedbackText}>
                        {answerState === 'correct' ? t('correct') : t('wrong_answer')}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        backgroundColor: '#ffffff',
        paddingTop: 45,
        paddingBottom: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        zIndex: 100,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#000000', fontSize: 20, fontWeight: '800' },
    content: {
        flex: 1,
    },
    introduction: {
        padding: 24,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
        lineHeight: 30,
        paddingBottom: 4,
    },
    introDesc: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 22,
        textAlign: 'justify',
    },
    sectionDivider: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    gridContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    categoryCount: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    finishBtn: {
        width: '100%',
        height: 64,
        backgroundColor: '#7C3AED',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    finishBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    categoryList: { padding: 15, gap: 15 },
    categoryMainCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        elevation: 2,
    },
    categoryImageContainer: {
        width: '100%',
        aspectRatio: 16 / 10,
        padding: 12,
        backgroundColor: '#FFFFFF'
    },
    categoryCardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    categoryCardBody: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: 8,
    },
    categoryCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
    categoryCardSub: { fontSize: 13, color: '#666', marginBottom: 12 },
    quizSelectionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 10,
    },
    quizInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    quizInfoLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    startQuizBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#0179e9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    startQuizBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    gameBody: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    visualCard: {
        width: '100%',
        height: height * 0.35,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 25,
        position: 'relative',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0, right: 0,
        height: 100,
    },
    questionTextContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    questionText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    feedbackOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedbackText: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
        marginTop: 15,
        letterSpacing: 2,
    },
    optionSub: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    resultsContainer: {
        flex: 1,
    },
    resultStarsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    resultTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 25,
    },
    resultScoreCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    resultScoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    resultScoreNum: {
        fontSize: 48,
        fontWeight: '900',
        color: '#7C3AED',
    },
    resultScoreLabel: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '600',
    },
    savingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    resultCorrectLabel: {
        fontSize: 18,
        color: '#1E293B',
        fontWeight: '700',
        marginBottom: 15,
    },
    resultDotRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 40,
        width: '100%',
    },
    resultDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultDotGreen: {
        backgroundColor: '#22C55E',
    },
    resultDotRed: {
        backgroundColor: '#EF4444',
    },
    resultActionBox: {
        width: '100%',
        gap: 12,
    },
    resultPrimaryBtn: {
        width: '100%',
        height: 60,
        backgroundColor: '#7C3AED',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    resultPrimaryBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    resultSecondaryBtn: {
        width: '100%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultSecondaryBtnText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '700',
    },
    // Modern Gaming Styles
    bgCircle: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        zIndex: 0,
    },
    headerContainer: {
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        height: 100,
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
    headerInfo: {
        flex: 1,
        alignItems: 'stretch',
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gameHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#334155',
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
    mainCard: {
        width: '100%',
        aspectRatio: 1.1,
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 15,
        marginBottom: 25,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        overflow: 'hidden',
    },
    mainCardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    mainCardOverlay: {
        position: 'absolute',
        top: 25,
        left: 25,
    },
    mainCardBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '900',
        color: '#7C3AED',
    },
    optionsArea: {
        gap: 12,
    },
    optBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 14,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        elevation: 2,
    },
    optBtnCorrect: {
        backgroundColor: '#22C55E',
        borderColor: '#22C55E',
    },
    optBtnWrong: {
        backgroundColor: '#FEF2F2',
        borderColor: '#EF4444',
    },
    optLetterBox: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optLetterText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#64748B',
    },
    optContent: {
        flex: 1,
    },
    optTextKhm: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    optTextVie: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    modernFeedback: {
        position: 'absolute',
        top: '50%',
        left: '10%',
        right: '10%',
        marginTop: -100,
        backgroundColor: 'rgba(34, 197, 94, 0.95)',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        elevation: 20,
        zIndex: 1000,
    },
    modernFeedbackWrong: {
        backgroundColor: 'rgba(239, 68, 68, 0.95)',
    },
    feedbackIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modernFeedbackText: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
    },
    headerCloseBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -9,
    },
});
