import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
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
  // Placeholder implementation
  console.log('Toggling favorite for', templeId, 'to', isFavorite);
  return Promise.resolve();
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
