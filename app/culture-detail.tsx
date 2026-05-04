import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CultureDetailScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.centeredContent}>
        <Ionicons name="color-palette-outline" size={80} color="#E2E8F0" />
        <Text style={styles.comingSoonTitle}>{t('content_updating')}</Text>
        <Text style={styles.comingSoonSub}>{t('check_back_later')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 20,
    textAlign: 'center',
  },
  comingSoonSub: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
  },
});
