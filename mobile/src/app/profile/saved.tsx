import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../../lib/api';

export default function SavedCampsitesScreen() {
  const insets = useSafeAreaInsets();
  const [campsites, setCampsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await apiFetch('/saved');
      const data = await res.json();
      if (data.success) {
        setCampsites(data.data.map((c: any) => ({
          id: c._id,
          name: c.name,
          wilaya: c.wilaya,
          type: c.type,
          price: c.pricePerNight,
          image: c.images?.[0] || 'https://images.unsplash.com/photo-1504280387937-31c402506e78?w=800&auto=format&fit=crop',
        })));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSaved().finally(() => setLoading(false));
  }, [fetchSaved]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  }, [fetchSaved]);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/campsite/${item.id}`)}
    >
      <Image source={item.image} style={styles.cardImage} contentFit="cover" transition={300} />
      <LinearGradient colors={['transparent', 'rgba(15,23,42,0.95)']} style={styles.cardGradient} />

      <View style={styles.cardTopRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.type?.toUpperCase()}</Text>
        </View>
        <View style={styles.heartBadge}>
          <Text style={styles.heartIcon}>❤️</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardLoc}>📍 {item.wilaya}</Text>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.priceVal}>{item.price?.toLocaleString() || '---'}</Text>
          <Text style={styles.priceSub}>DZD/night</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Saved Campsites</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ef4444" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={campsites}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" colors={['#ef4444']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💔</Text>
              <Text style={styles.emptyTitle}>No saved campsites</Text>
              <Text style={styles.emptySub}>Tap the heart icon on a campsite to save it here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b'
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#f1f5f9', fontSize: 20 },
  headerTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' },

  listContent: { padding: 20, gap: 18, paddingBottom: 30 },

  card: {
    borderRadius: 22, overflow: 'hidden', backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#1e3a5f',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  cardPressed: { transform: [{ scale: 0.975 }], opacity: 0.9 },
  cardImage: { width: '100%', height: 200 },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },

  cardTopRow: {
    position: 'absolute', top: 14, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  typeBadge: {
    backgroundColor: '#f97316', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  heartBadge: {
    backgroundColor: '#fff', borderRadius: 20, width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  heartIcon: { fontSize: 16 },

  cardInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', padding: 14,
  },
  cardName: { color: '#f1f5f9', fontSize: 17, fontWeight: 'bold', marginBottom: 3 },
  cardLoc: { color: '#94a3b8', fontSize: 12 },
  priceWrap: { alignItems: 'flex-end' },
  priceVal: { color: '#f97316', fontSize: 16, fontWeight: 'bold' },
  priceSub: { color: '#94a3b8', fontSize: 11 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' },
  emptySub: { color: '#64748b', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
