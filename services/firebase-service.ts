import { collection, getDocs, limit, orderBy, query, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";

export interface UserProfile {
  uid: string;
  name: string;
  points: number;
  avatar?: string | null;
}

export interface Temple {

  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  location?: string;
  rental?: string;
  description?: string;
  category?: string;
  isFavorite?: boolean;
  detailedDescription?: any;
  additionalImages?: string[];
}

export const toggleFavorite = async (templeId: string, isFavorite: boolean): Promise<void> => {
  try {
    const templeRef = doc(db, 'destinations', templeId);
    await updateDoc(templeRef, { favorite: isFavorite });
    console.log('Toggled favorite for', templeId, 'to', isFavorite);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

export const getNearbyTemples = async (lat: number, lng: number, radius: number): Promise<Temple[]> => {
  // Return some dummy data so the UI doesn't look empty
  return [
    {
      id: 'temple1',
      name: 'Chùa Âng',
      latitude: 9.9325,
      longitude: 106.3361,
      location: 'Phường 8, Trà Vinh',
      imageUrl: 'https://thamhiemmekong.com/wp-content/uploads/2020/03/chua-ang-1.jpg',
    },
    {
      id: 'temple2',
      name: 'Chùa Dơi',
      latitude: 9.5898,
      longitude: 105.9754,
      location: 'Phường 3, Sóc Trăng',
      imageUrl: 'https://mia.vn/media/uploads/blog-du-lich/doi-net-1706424557.jpg',
    }
  ];
};

export const getLeaderboardUsers = async (count: number = 20): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('points', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        name: data.name || data['tên'] || 'Anonymous',
        points: data.points ?? 0,
        avatar: data.avatar || data['hình đại diện'] || null,
      });
    });
    
    return users;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

export const addUserPoints = async (userId: string, points: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(points),
    });
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};
export const updateQuizScore = async (userId: string, pagodaId: string, newScore: number): Promise<number> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return 0;
    
    const userData = userSnap.data();
    const bestScores = userData.quizBestScores || {};
    const previousBest = bestScores[pagodaId] || 0;
    
    if (newScore > previousBest) {
      const difference = newScore - previousBest;
      await updateDoc(userRef, {
        points: increment(difference),
        [`quizBestScores.${pagodaId}`]: newScore
      });
      return difference;
    }
    
    return 0; // No points added because score didn't improve
  } catch (error) {
    console.error('Error updating quiz score:', error);
    throw error;
  }
};

export const getQuizData = async (pagodaId: string): Promise<any | null> => {
  try {
    const quizRef = doc(db, 'quizzes', pagodaId);
    const quizSnap = await getDoc(quizRef);
    if (quizSnap.exists()) {
      return quizSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    return null;
  }
};

export const seedQuizzes = async (quizzes: any[]): Promise<void> => {
  const { setDoc } = await import("firebase/firestore");
  try {
    for (const quiz of quizzes) {
      // Remove image require for Firestore (use imageUrl instead or handle separately)
      const { image, ...quizToUpload } = quiz;
      await setDoc(doc(db, 'quizzes', quiz.pagodaId), quizToUpload);
    }
    console.log('Quizzes seeded successfully');
  } catch (error) {
    console.error('Error seeding quizzes:', error);
    throw error;
  }
};
export const seedVocabQuizzes = async (categories: any[]): Promise<void> => {
  const { setDoc } = await import("firebase/firestore");
  try {
    for (const cat of categories) {
      // Add sample image URLs for each word if they don't have one
      const wordsWithImages = cat.words.map((w: any) => ({
        ...w,
        imageUrl: w.imageUrl || 'https://raw.githubusercontent.com/NhatHao2004/khoaluan_totnghiep_khmergo/main/assets/images/hoctap.jpg'
      }));
      
      const catToUpload = {
        ...cat,
        words: wordsWithImages,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'vocab_categories', cat.id), catToUpload);
    }
    console.log('Vocab quizzes seeded successfully');
  } catch (error) {
    console.error('Error seeding vocab quizzes:', error);
    throw error;
  }
};
