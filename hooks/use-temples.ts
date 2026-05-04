import { useState, useEffect } from 'react';
import { db } from '@/utils/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useTemples = () => {
  const [temples, setTemples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Truy vấn collection destinations để lọc ra những địa điểm thuộc loại "Chùa"
    const q = query(
      collection(db, 'destinations'),
      where('category', '==', 'Chùa')
    );

    // Lắng nghe dữ liệu thay đổi realtime từ Firebase
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTemples: any[] = [];
        snapshot.forEach((doc) => {
          fetchedTemples.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sắp xếp theo ID để hiển thị chuẩn xác hơn
        fetchedTemples.sort((a, b) => (a.id > b.id ? 1 : -1));
        
        setTemples(fetchedTemples);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching temples from Firebase: ", err);
        setError("Không thể tải hệ thống chùa. Vui lòng kiểm tra kết nối mạng.");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const refresh = () => {
    // onSnapshot đã tự động refresh realtime nên hàm này chỉ để giữ interface tương thích
    setLoading(true);
    setTimeout(() => setLoading(false), 500); // Fake delay
  };

  return { temples, loading, error, refresh };
};
