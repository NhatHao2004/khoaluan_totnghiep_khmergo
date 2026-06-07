import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../utils/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { router } from 'expo-router';

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        if (userData?.role === 'Quản trị viên') {
          setIsAdmin(true);
        } else {
          console.error("Access denied: Not an administrator");
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.replace('/(tabs)');
      }
    };

    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '800',
          color: '#1e293b',
        },
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#f8fafc' }, // Nền xám cho toàn bộ stack admin
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="user"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
