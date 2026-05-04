import { useState, useEffect } from 'react';
import { db } from '@/utils/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useCultures = () => {
  const [cultures, setCultures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Truy vấn collection destinations để lọc ra những địa điểm thuộc loại "Văn hóa"
    const q = query(
      collection(db, 'destinations'),
      where('category', '==', 'Văn hóa')
    );

    // Lắng nghe dữ liệu thay đổi realtime từ Firebase
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedCultures: any[] = [];
        snapshot.forEach((doc) => {
          fetchedCultures.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sắp xếp theo ID hoặc tên
        fetchedCultures.sort((a, b) => (a.name > b.name ? 1 : -1));
        
        setCultures(fetchedCultures);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching cultures from Firebase: ", err);
        setError("Không thể tải dữ liệu văn hóa. Vui lòng kiểm tra kết nối mạng.");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return { cultures, loading, error, refresh };
};
