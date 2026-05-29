import { useState, useEffect } from 'react';
import { db } from '@/utils/firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  pagodaId: string;
  pagodaName: string;
  pagodaNameKm: string;
  location: string;
  image: any;
  imageUrl?: string;
  color: string;
  accentColor: string;
  questions: MCQQuestion[];
}

export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const q = query(collection(db, 'quizzes'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedQuizzes: QuizData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedQuizzes.push({
            pagodaId: doc.id,
            pagodaName: data.pagodaName || data.name || '',
            pagodaNameKm: data.pagodaNameKm || data.name_khmer || '',
            location: data.location || '',
            image: null,
            imageUrl: data.imageUrl || '',
            color: data.color || '#0179e9ff',
            accentColor: data.accentColor || '#f0f7ffff',
            questions: data.questions || []
          });
        });
        
        setQuizzes(fetchedQuizzes);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching quizzes: ", err);
        setError("Không thể tải dữ liệu thử thách.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading]);

  return { quizzes, loading, error };
};
