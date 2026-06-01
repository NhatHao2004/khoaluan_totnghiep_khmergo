import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { updateQuizScore } from '@/services/firebase-service';
import React, { useEffect, useRef, useState } from 'react';
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

const { height } = Dimensions.get('window');
const POINTS_PER_WORD = 5;

type GameState = 'selection' | 'playing' | 'results';

export default function VocabQuizScreen() {
    const router = useRouter();
    const { t } = useLanguage();
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
            Animated.timing(cardShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(cardShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const prepareGame = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category || !category.words) return;

        // Take 6 words for a good matching density on screen
        const words = [...category.words].sort(() => 0.5 - Math.random()).slice(0, 6);
        
        const left = words.map(w => ({ id: w.id, text: w.khm })).sort(() => 0.5 - Math.random());
        const right = words.map(w => ({ id: w.id, text: w.vie })).sort(() => 0.5 - Math.random());

        setLeftItems(left);
        setRightItems(right);
        setMatches([]);
        setSelectedLeft(null);
        setSelectedRight(null);
        setScore(0);
        setGameState('playing');
        setHasSaved(false);
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

    if (gameState === 'results') {
        return (
            <View style={styles.resultsContainer}>
                <LinearGradient colors={['#F5F3FF', '#FFF', '#F5F3FF']} style={StyleSheet.absoluteFill} />
                <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 }}>
                    <Ionicons name="trophy" size={80} color="#FBBF24" style={{ marginBottom: 20 }} />
                    <Text style={styles.resultTitle}>{t('excellent')}</Text>
                    <View style={styles.resultScoreCard}>
                        <Text style={styles.resultScoreNum}>+{score}</Text>
                        <Text style={styles.resultScoreLabel}>{t('points_earned')}</Text>
                        {isSaving && <Text style={styles.savingText}>{t('saving_results')}</Text>}
                        {hasSaved && <Text style={styles.savedText}>{t('results_saved')}</Text>}
                    </View>
                    <TouchableOpacity style={styles.resultPrimaryBtn} onPress={() => prepareGame(selectedCategory!)}>
                        <Ionicons name="refresh" size={20} color="#FFF" />
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
                <TouchableOpacity onPress={() => resetGame()} style={styles.headerCloseBtn}>
                    <Ionicons name="close" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.gameHeaderTitle}>{t('matching_challenge').toUpperCase()}</Text>
                <View style={styles.scorePill}>
                    <Ionicons name="flash" size={16} color="#F59E0B" />
                    <Text style={styles.scorePillText}>{score}</Text>
                </View>
            </View>

            <Animated.View style={{ flex: 1, flexDirection: 'row', padding: 15, gap: 15, transform: [{translateX: cardShake}] }}>
                {/* Khmer Column */}
                <View style={{ flex: 1, gap: 10 }}>
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
                <View style={{ flex: 1, gap: 10 }}>
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

            <View style={styles.instructionFooter}>
                <Ionicons name="information-circle-outline" size={20} color="#64748B" />
                <Text style={styles.instructionText}>{t('match_words_instruction')}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        backgroundColor: '#ffffff',
        paddingTop: 45,
        paddingBottom: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        zIndex: 100,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
    content: { flex: 1 },
    introduction: { padding: 24, backgroundColor: '#FFF', marginBottom: 16 },
    introTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
    introDesc: { fontSize: 15, color: '#64748B', lineHeight: 22 },
    categoryList: { padding: 15, gap: 15 },
    categoryMainCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 0, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
    categoryImageContainer: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#FFFFFF', padding: 12 },
    categoryCardImage: { width: '100%', height: '100%', borderRadius: 16 },
    categoryCardBody: { padding: 20, gap: 4 },
    categoryCardTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    categoryCardSub: { fontSize: 14, color: '#64748B', marginBottom: 8 },
    quizSelectionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
    quizInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    quizInfoLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    startQuizBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
    startQuizBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
    resultsContainer: { flex: 1 },
    resultTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    resultScoreCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center', marginBottom: 30, elevation: 4 },
    resultScoreNum: { fontSize: 56, fontWeight: '900', color: '#7C3AED' },
    resultScoreLabel: { fontSize: 16, color: '#64748B', fontWeight: '600' },
    resultPrimaryBtn: { width: '100%', height: 60, backgroundColor: '#7C3AED', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    resultPrimaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    resultSecondaryBtn: { width: '100%', height: 60, alignItems: 'center', justifyContent: 'center' },
    resultSecondaryBtnText: { color: '#64748B', fontSize: 16, fontWeight: '700' },
    savingText: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
    savedText: { fontSize: 12, color: '#22C55E', fontWeight: '700', marginTop: 8 },
    headerContainer: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
    headerCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    gameHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#334155' },
    scorePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#FEF3C7' },
    scorePillText: { fontSize: 16, fontWeight: '900', color: '#D97706' },
    matchCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, height: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9', elevation: 2 },
    matchCardSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    matchCardMatched: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    matchCardWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    matchText: { fontSize: 16, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
    matchTextSelected: { color: '#3B82F6' },
    matchTextMatched: { color: '#22C55E' },
    instructionFooter: { padding: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    instructionText: { color: '#64748B', fontWeight: '700', fontSize: 14 }
});
