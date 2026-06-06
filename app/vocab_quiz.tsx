import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateQuizScore } from '@/services/firebase-service';
import { db } from '@/utils/firebaseConfig';
import { scale, verticalScale, moderateScale } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';

const { height } = Dimensions.get('window');
const POINTS_PER_WORD = 5;

type GameState = 'selection' | 'playing' | 'results';

export default function VocabQuizScreen() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const isKm = language === 'km';
    const { user, refreshUser } = useAuth();

    const [gameState, setGameState] = useState<GameState>('selection');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Matching Game State
    const [leftItems, setLeftItems] = useState<{ id: string, text: string }[]>([]);
    const [rightItems, setRightItems] = useState<{ id: string, text: string }[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);
    const [matches, setMatches] = useState<string[]>([]);
    const [wrongMatch, setWrongMatch] = useState<{ left: string, right: string } | null>(null);

    const [score, setScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120);

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

    // Animations
    const cardShake = useRef(new Animated.Value(0)).current;

    const shakeAnimation = () => {
        Animated.sequence([
            Animated.timing(cardShake, { toValue: scale(10), duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: scale(-10), duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: scale(5), duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: scale(-5), duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const prepareGame = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category || !category.words) return;

        // Take 10 words for a good matching density on screen
        const words = [...category.words].sort(() => 0.5 - Math.random()).slice(0, 10);

        const leftItemsData: any[] = [];
        const rightItemsData: any[] = [];

        // Mix of types: 0 = Khm on Left/Vie on Right, 1 = Vie on Left/Khm on Right
        const parities = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1].sort(() => 0.5 - Math.random());

        words.forEach((w, index) => {
            const vieText = w.life || w.vie || '';
            if (parities[index] === 0) {
                leftItemsData.push({ id: w.id, text: w.khm, type: 'khm' });
                rightItemsData.push({ id: w.id, text: vieText, type: 'vie' });
            } else {
                leftItemsData.push({ id: w.id, text: vieText, type: 'vie' });
                rightItemsData.push({ id: w.id, text: w.khm, type: 'khm' });
            }
        });

        // Shuffle each column result
        setLeftItems(leftItemsData.sort(() => 0.5 - Math.random()));
        setRightItems(rightItemsData.sort(() => 0.5 - Math.random()));
        setMatches([]);
        setSelectedLeft(null);
        setSelectedRight(null);
        setScore(0);
        setGameState('playing');
        setHasSaved(false);
        setTimeLeft(120);
    };

    const handleMatch = (type: 'left' | 'right', id: string) => {
        if (matches.includes(id)) return;

        if (type === 'left') {
            if (selectedLeft === id) {
                setSelectedLeft(null);
            } else {
                setSelectedLeft(id);
                if (selectedRight) {
                    checkMatch(id, selectedRight);
                }
            }
        } else {
            if (selectedRight === id) {
                setSelectedRight(null);
            } else {
                setSelectedRight(id);
                if (selectedLeft) {
                    checkMatch(selectedLeft, id);
                }
            }
        }
    };

    const checkMatch = (leftId: string, rightId: string) => {
        if (leftId === rightId) {
            // Correct match
            const newMatches = [...matches, leftId];
            setMatches(newMatches);
            setSelectedLeft(null);
            setSelectedRight(null);
            setScore(prev => prev + POINTS_PER_WORD);
            Vibration.vibrate(50);

            // Check if all matched
            if (newMatches.length === leftItems.length) {
                setTimeout(() => setGameState('results'), 800);
            }
        } else {
            // Wrong match
            setWrongMatch({ left: leftId, right: rightId });
            shakeAnimation();
            Vibration.vibrate(100);
            setTimeout(() => {
                setWrongMatch(null);
                setSelectedLeft(null);
                setSelectedRight(null);
            }, 600);
        }
    };

    // Timer Logic
    useEffect(() => {
        let timer: any;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('results');
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const resetGame = () => {
        setGameState('selection');
        setSelectedCategory(null);
        setScore(0);
        setMatches([]);
        setSelectedLeft(null);
        setSelectedRight(null);
        setHasSaved(false);
    };

    // Auto-save results
    useEffect(() => {
        if (gameState === 'results' && user && score > 0 && !hasSaved && !isSaving) {
            saveResults();
        }
    }, [gameState]);

    const saveResults = async () => {
        if (!user || score <= 0 || hasSaved || isSaving) return;
        setIsSaving(true);
        try {
            const isPerfect = matches.length === leftItems.length;
            await updateQuizScore(user.uid, selectedCategory as string, score, isPerfect);
            await refreshUser();
            setHasSaved(true);
        } catch (error) {
            console.error('Error saving vocab quiz score:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (gameState === 'selection') {
        return (
            <View style={styles.container}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={scale(28)} color="#000000" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
                                {t('vocab_quiz')}
                            </ThemedText>
                        </View>

                        <View style={{ width: scale(50) }} />
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
                                            source={
                                                category.imageUrl
                                                    ? { uri: category.imageUrl }
                                                    : (category.title === 'cat_family' || category.id === 'family') ? require('@/assets/images/giadinh.jpg') :
                                                    (category.title === 'cat_food' || category.id === 'food') ? require('@/assets/images/monan.jpg') :
                                                    (category.title === 'cat_greetings' || category.id === 'greetings') ? require('@/assets/images/chaohoi.jpg') :
                                                    (category.title === 'cat_numbers' || category.id === 'numbers') ? require('@/assets/images/sodem.jpg') :
                                                    require('@/assets/images/giadinh.jpg')
                                            }
                                            style={styles.categoryCardImage}
                                            contentFit="contain"
                                        />
                                    </View>

                                    {/* Content */}
                                    <View style={styles.categoryCardBody}>
                                        <Text style={styles.categoryCardTitle}>
                                            {isKm && category.titleKm ? category.titleKm : t(category.title)}
                                        </Text>
                                        <Text style={styles.categoryCardSub}>{Math.min(10, category.words?.length || 0)} {t('vocab_challenge_questions')}</Text>

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
                                                    prepareGame(category.id);
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

    const stars = leftItems.length > 0 ? Math.ceil((matches.length / leftItems.length) * 5) : 0;

    if (gameState === 'results') {
        return (
            <View style={styles.resultsContainer}>
                <LinearGradient colors={['#F5F3FF', '#FFF', '#F5F3FF']} style={StyleSheet.absoluteFill} />
                <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: scale(25) }}>
                    <View style={styles.resultStarsRow}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Ionicons
                                key={s}
                                name={s <= stars ? 'star' : 'star-outline'}
                                size={scale(44)}
                                color={s <= stars ? '#FBBF24' : '#E2E8F0'}
                                style={{ marginHorizontal: scale(4) }}
                            />
                        ))}
                    </View>
                    <Text style={styles.resultTitle}>
                        {stars === 5 ? t('excellent') : stars >= 4 ? t('well_done') : t('keep_it_up')}
                    </Text>
                    <View style={styles.resultScoreCard}>
                        <Text style={styles.resultScoreNum}>+{score}</Text>
                        <Text style={styles.resultScoreLabel}>{t('points_earned')}</Text>
                        {isSaving && <Text style={styles.savingText}>{t('saving_results')}</Text>}
                        {hasSaved && <Text style={styles.savedText}>{t('results_saved')}</Text>}
                    </View>
                    <TouchableOpacity style={styles.resultPrimaryBtn} onPress={() => prepareGame(selectedCategory!)}>
                        <Ionicons name="refresh" size={scale(20)} color="#FFF" />
                        <Text style={styles.resultPrimaryBtnText}>{t('replay')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resultSecondaryBtn} onPress={resetGame}>
                        <Text style={styles.resultSecondaryBtnText}>{t('choose_another_quiz')}</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.headerCloseBtn}>
                    <Ionicons name="arrow-back" size={scale(28)} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={scale(20)} color={timeLeft < 30 ? '#EF4444' : '#1E293B'} />
                    <Text style={[styles.timerText, timeLeft < 30 && { color: '#EF4444' }]}>{formatTime(timeLeft)}</Text>
                </View>
                <View style={styles.scorePill}>
                    <Ionicons name="flash" size={scale(16)} color="#F59E0B" />
                    <Text style={styles.scorePillText}>{score}</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ flex: 1, flexDirection: 'row', padding: scale(20), gap: scale(20), transform: [{ translateX: cardShake }] }}>
                    {/* Khmer Column */}
                    <View style={{ flex: 1, gap: scale(10) }}>
                        {leftItems.map((item) => {
                            const isMatched = matches.includes(item.id);
                            const isSelected = selectedLeft === item.id;
                            const isWrong = wrongMatch?.left === item.id;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleMatch('left', item.id)}
                                    disabled={isMatched}
                                    style={[
                                        styles.matchCard,
                                        isSelected && styles.matchCardSelected,
                                        isMatched && styles.matchCardMatched,
                                        isWrong && styles.matchCardWrong,
                                        isMatched && { opacity: 0.3 }
                                    ]}
                                >

                                    <Text style={[styles.matchText, isSelected && styles.matchTextSelected, isMatched && styles.matchTextMatched]}>{item.text}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Vietnamese Column */}
                    <View style={{ flex: 1, gap: scale(10) }}>
                        {rightItems.map((item) => {
                            const isMatched = matches.includes(item.id);
                            const isSelected = selectedRight === item.id;
                            const isWrong = wrongMatch?.right === item.id;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleMatch('right', item.id)}
                                    disabled={isMatched}
                                    style={[
                                        styles.matchCard,
                                        isSelected && styles.matchCardSelected,
                                        isMatched && styles.matchCardMatched,
                                        isWrong && styles.matchCardWrong,
                                        isMatched && { opacity: 0.3 }
                                    ]}
                                >

                                    <Text style={[styles.matchText, isSelected && styles.matchTextSelected, isMatched && styles.matchTextMatched]}>{item.text}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </ScrollView>

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
                            <Ionicons name="exit-outline" size={scale(40)} color="#EF4444" />
                        </View>
                        <Text style={styles.exitTitle}>{t('exit_game_title')}</Text>
                        <Text style={styles.exitSub}>{t('exit_game_msg')}</Text>

                        <View style={styles.exitActionRow}>
                            <TouchableOpacity
                                style={styles.stayBtn}
                                onPress={() => setShowExitModal(false)}
                            >
                                <Text style={styles.stayBtnText}>{t('continue')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmExitBtn}
                                onPress={() => {
                                    setShowExitModal(false);
                                    resetGame();
                                }}
                            >
                                <Text style={styles.confirmExitBtnText}>{t('exit')}</Text>
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
    header: {
        backgroundColor: '#ffffff',
        paddingTop: verticalScale(45),
        paddingBottom: verticalScale(15),
        paddingHorizontal: scale(15),
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        zIndex: 100,
    },
    backBtn: { width: scale(40), height: scale(40), justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#0F172A', fontSize: moderateScale(20), fontWeight: '800' },
    content: { flex: 1 },
    introduction: { padding: scale(24), backgroundColor: '#FFF', marginBottom: verticalScale(16) },
    introTitle: { fontSize: moderateScale(22), fontWeight: '900', color: '#1E293B', marginBottom: verticalScale(8) },
    introDesc: { fontSize: moderateScale(15), color: '#64748B', lineHeight: verticalScale(22) },
    categoryList: { padding: scale(15), gap: verticalScale(15) },
    categoryMainCard: { backgroundColor: '#FFF', borderRadius: scale(24), padding: 0, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
    categoryImageContainer: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#FFFFFF', padding: scale(12) },
    categoryCardImage: { width: '100%', height: '100%', borderRadius: scale(16) },
    categoryCardBody: { padding: scale(20), gap: scale(4) },
    categoryCardTitle: { fontSize: moderateScale(18), fontWeight: '800', color: '#1E293B' },
    categoryCardSub: { fontSize: moderateScale(14), color: '#64748B', marginBottom: verticalScale(8) },
    quizSelectionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: verticalScale(12) },
    quizInfoBox: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
    quizInfoLabel: { fontSize: moderateScale(12), color: '#64748B', fontWeight: '600' },
    startQuizBtn: { backgroundColor: '#3B82F6', paddingHorizontal: scale(16), paddingVertical: verticalScale(8), borderRadius: scale(12), alignItems: 'center' },
    startQuizBtnText: { color: '#FFF', fontWeight: '800', fontSize: moderateScale(13) },
    resultsContainer: { flex: 1 },
    resultTitle: { fontSize: moderateScale(32), fontWeight: '900', color: '#1E293B', marginBottom: verticalScale(20) },
    resultStarsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: verticalScale(24) },
    resultScoreCard: { width: '100%', backgroundColor: '#FFF', borderRadius: scale(32), padding: scale(30), alignItems: 'center', marginBottom: verticalScale(30), elevation: 4 },
    resultScoreNum: { fontSize: moderateScale(56), fontWeight: '900', color: '#7C3AED' },
    resultScoreLabel: { fontSize: moderateScale(16), color: '#64748B', fontWeight: '600' },
    resultPrimaryBtn: { width: '100%', height: verticalScale(60), backgroundColor: '#7C3AED', borderRadius: scale(20), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(12) },
    resultPrimaryBtnText: { color: '#FFF', fontSize: moderateScale(18), fontWeight: '800' },
    resultSecondaryBtn: { width: '100%', height: verticalScale(60), alignItems: 'center', justifyContent: 'center' },
    resultSecondaryBtnText: { color: '#64748B', fontSize: moderateScale(16), fontWeight: '700' },
    savingText: { fontSize: moderateScale(12), color: '#94A3B8', marginTop: verticalScale(8) },
    savedText: { fontSize: moderateScale(12), color: '#22C55E', fontWeight: '700', marginTop: verticalScale(8) },
    headerContainer: { paddingTop: verticalScale(50), paddingHorizontal: scale(20), paddingBottom: verticalScale(20), backgroundColor: '#FFF', borderBottomLeftRadius: scale(32), borderBottomRightRadius: scale(32), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
    headerCloseBtn: { width: scale(40), height: scale(40), justifyContent: 'center', alignItems: 'center' },
    gameHeaderTitle: { fontSize: moderateScale(16), fontWeight: '800', color: '#334155' },
    timerContainer: { flexDirection: 'row', alignItems: 'center', gap: scale(6), backgroundColor: '#F1F5F9', paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: scale(20) },
    timerText: { fontSize: moderateScale(16), fontWeight: '800', color: '#1E293B', fontVariant: ['tabular-nums'] },
    scorePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: scale(20), gap: scale(6), borderWidth: 1, borderColor: '#FEF3C7' },
    scorePillText: { fontSize: moderateScale(16), fontWeight: '900', color: '#D97706' },
    matchCard: { backgroundColor: '#FFF', borderRadius: scale(20), padding: scale(12), height: verticalScale(70), justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9', elevation: 2 },
    matchCardSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    matchCardMatched: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    matchCardWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    matchText: { fontSize: moderateScale(16), fontWeight: '800', color: '#1E293B', textAlign: 'center' },
    matchTextSelected: { color: '#3B82F6' },
    matchTextMatched: { color: '#22C55E' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(20),
    },
    exitModalContent: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: scale(32),
        padding: scale(30),
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(4) },
        shadowOpacity: 0.25,
        shadowRadius: scale(10),
    },
    exitIconCircle: {
        width: scale(80),
        height: scale(80),
        borderRadius: scale(40),
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(20),
        paddingLeft: scale(7),
    },
    exitTitle: {
        fontSize: moderateScale(22),
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: verticalScale(10),
        textAlign: 'center',
    },
    exitSub: {
        fontSize: moderateScale(16),
        color: '#64748B',
        textAlign: 'center',
        marginBottom: verticalScale(30),
        lineHeight: verticalScale(24),
    },
    exitActionRow: {
        width: '100%',
        gap: scale(12),
    },
    stayBtn: {
        width: '100%',
        height: verticalScale(56),
        backgroundColor: '#3B82F6',
        borderRadius: scale(16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    stayBtnText: {
        fontSize: moderateScale(16),
        fontWeight: '700',
        color: '#FFF',
    },
    confirmExitBtn: {
        width: '100%',
        height: verticalScale(56),
        backgroundColor: '#EF4444',
        borderRadius: scale(16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmExitBtnText: {
        fontSize: moderateScale(16),
        fontWeight: '700',
        color: '#FFF',
    },
});
