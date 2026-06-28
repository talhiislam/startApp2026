import { StyleSheet, View, ScrollView, Text, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '../../constants/api';
import { LinearGradient } from 'expo-linear-gradient';

type User = { name?: string; username?: string; email: string };

const MENU_ITEMS = [
  { id: '1', icon: '🔔', label: 'Notifications',     sub: 'Manage alerts & reminders',   color: '#3b82f6', route: '/profile/notifications' },
  { id: '2', icon: '❤️', label: 'Saved Campsites',   sub: 'Your favourites list',         color: '#ef4444', route: '/profile/saved' },
  { id: '3', icon: '💳', label: 'Payment Methods',   sub: 'Manage your cards',            color: '#22c55e', route: '/profile/payments' },
  { id: '4', icon: '🛡️', label: 'Privacy & Security',sub: 'Account & data settings',      color: '#8b5cf6', route: '/profile/security' },
  { id: '5', icon: '📞', label: 'Support',           sub: 'Get help & contact us',        color: '#f97316', route: '/profile/support' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [tripCount, setTripCount] = useState<number | '-'>('-');
  const [savedCount, setSavedCount] = useState<number | '-'>('-');

  useEffect(() => {
    AsyncStorage.getItem('user').then(data => {
      if (data) setUser(JSON.parse(data));
      else router.replace('/login');
    });

    fetch(`${API_URL}/bookings`)
      .then(res => res.json())
      .then(data => { if (data.success) setTripCount(data.data.length); })
      .catch(() => {});

    fetch(`${API_URL}/saved`)
      .then(res => res.json())
      .then(data => { if (data.success) setSavedCount(data.data.length); })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('user');
          router.replace('/login');
        }
      },
    ]);
  };

  if (!user) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#64748b' }}>Loading...</Text>
    </View>
  );

  const displayName = user.username || user.name || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero section with gradient */}
        <LinearGradient colors={['#1a1f3a', '#0f172a']} style={styles.hero}>
          {/* Avatar */}
          <View style={styles.avatarRing}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              ['🏕️', String(tripCount), 'Trips'],
              ['❤️', String(savedCount), 'Saved'],
              ['⭐', '—', 'Reviews'],
            ].map(([emoji, val, label]) => (
              <View key={label} style={styles.statItem}>
                <Text style={styles.statEmoji}>{emoji}</Text>
                <Text style={styles.statNum}>{val}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Edit profile button */}
        <View style={styles.actionRow}>
          <Pressable 
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editBtnText}>✏️  Edit Profile</Text>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.8 }]}
            onPress={() => Alert.alert('Coming Soon', 'Sharing feature is under development.')}
          >
            <Text style={styles.shareBtnText}>📤</Text>
          </Pressable>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.menuItem,
                i === MENU_ITEMS.length - 1 && styles.menuItemLast,
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.color + '22' }]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>🚪  Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>SahaTour v1.0.0  ·  Made in Algeria 🇩🇿</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  hero: { alignItems: 'center', paddingTop: 30, paddingBottom: 28, paddingHorizontal: 24 },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    padding: 3,
    backgroundColor: '#f97316',
    marginBottom: 14,
    shadowColor: '#f97316', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  avatar: { flex: 1, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  name: { color: '#f1f5f9', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { color: '#64748b', fontSize: 14, marginBottom: 24 },

  statsRow: {
    flexDirection: 'row', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 8,
    borderWidth: 1, borderColor: '#1e3a5f',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 18 },
  statNum: { color: '#f97316', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: 11 },

  actionRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, marginBottom: 24, gap: 12 },
  editBtn: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 14,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  editBtnText: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  shareBtn: {
    width: 50, backgroundColor: '#1e293b', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  shareBtnText: { fontSize: 20 },

  menuCard: {
    marginHorizontal: 20, backgroundColor: '#1e293b',
    borderRadius: 20, borderWidth: 1, borderColor: '#334155',
    overflow: 'hidden', marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155', gap: 14,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemPressed: { backgroundColor: '#334155' },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 20 },
  menuText: { flex: 1 },
  menuLabel: { color: '#f1f5f9', fontSize: 15, fontWeight: '500' },
  menuSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  menuArrow: { color: '#475569', fontSize: 22 },

  signOutBtn: {
    marginHorizontal: 20, backgroundColor: '#1e293b',
    borderRadius: 14, padding: 15, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16,
  },
  signOutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },

  version: { color: '#334155', textAlign: 'center', fontSize: 12 },
});
