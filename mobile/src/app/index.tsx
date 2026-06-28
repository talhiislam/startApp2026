import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  // undefined = still loading, null = not logged in, string = logged in
  const [user, setUser] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem('user').then((val) => setUser(val));
  }, []);

  // Loading splash
  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⛺</Text>
        <Text style={{ color: '#f97316', fontSize: 26, fontWeight: 'bold' }}>SahaTour</Text>
        <Text style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Algeria's Premier Camping App</Text>
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
