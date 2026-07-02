import {
  StyleSheet, FlatList, View, Pressable, Text,
  TextInput, ScrollView, ActivityIndicator, RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { API_URL } from '../../constants/api';
import { LinearGradient } from 'expo-linear-gradient';

const FILTERS = ['All', 'tent', 'glamping', 'wild', 'bungalow'];
const FILTER_LABELS: Record<string, string> = {
  All: '🗺️ All', tent: '⛺ Tent', glamping: '✨ Glamping', wild: '🌿 Wild', bungalow: '🛖 Bungalow'
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [campsites, setCampsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampsites = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/campsites`);
      const data = await res.json();
      if (data.success) {
        setCampsites(data.data.map((c: any) => ({
          id: c._id,
          name: c.name,
          wilaya: c.wilaya,
          type: c.type,
          price: c.pricePerNight,
          rating: c.averageRating,
          reviews: c.reviewCount || 0,
          image: c.images?.[0] || 'https://images.unsplash.com/photo-1504280387937-31c402506e78?w=800&auto=format&fit=crop',
        })));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCampsites().finally(() => setLoading(false));
  }, [fetchCampsites]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCampsites();
    setRefreshing(false);
  }, [fetchCampsites]);

  const filtered = campsites.filter(c => {
    const matchFilter = activeFilter === 'All' || c.type === activeFilter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.wilaya.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

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
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingVal}>{item.rating}</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardLoc}>📍 {item.wilaya}  ·  {item.reviews} reviews</Text>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.priceVal}>{item.price.toLocaleString()}</Text>
          <Text style={styles.priceSub}>DZD/night</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSub}>{filtered.length} campsites found</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or wilaya..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text style={{ color: '#64748b', fontSize: 18, paddingHorizontal: 4 }}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏕️</Text>
              <Text style={styles.emptyTitle}>No campsites found</Text>
              <Text style={styles.emptySub}>Try different filters or search terms</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { color: '#f1f5f9', fontSize: 28, fontWeight: 'bold' },
  headerSub: { color: '#64748b', fontSize: 13, marginTop: 2 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', marginHorizontal: 20,
    borderRadius: 16, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#334155', marginBottom: 14,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 14, paddingVertical: 14 },

  filterScroll: { marginBottom: 14 },
  filterContent: { paddingHorizontal: 20, gap: 10, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  listContent: { padding: 20, paddingTop: 4, gap: 18, paddingBottom: 30 },

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
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  ratingStar: { color: '#fbbf24', fontSize: 13 },
  ratingVal: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

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
  emptySub: { color: '#64748b', fontSize: 13 },
});
