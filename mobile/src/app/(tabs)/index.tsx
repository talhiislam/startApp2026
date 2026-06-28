import {
  StyleSheet, View, ScrollView, Pressable, Dimensions, ActivityIndicator, Text, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../constants/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all',     label: 'All',     emoji: '🗺️' },
  { id: 'tent',    label: 'Tent',    emoji: '⛺' },
  { id: 'glamping',label: 'Glamping',emoji: '✨' },
  { id: 'wild',    label: 'Wild',    emoji: '🌿' },
  { id: 'bungalow',label: 'Bungalow',emoji: '🛖' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchCampsites = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/campsites`);
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.slice(0, 5).map((c: any) => ({
          id: c._id,
          name: c.name,
          wilaya: c.wilaya,
          type: c.type,
          price: c.pricePerNight,
          rating: c.averageRating,
          reviews: c.reviewCount || 0,
          image: c.images?.[0] || 'https://images.unsplash.com/photo-1504280387937-31c402506e78?w=800&auto=format&fit=crop',
        }));
        setFeatured(mapped);
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

  const filtered = activeCategory === 'all'
    ? featured
    : featured.filter(c => c.type === activeCategory);

  return (
    <View style={styles.root}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={['#0f172a', '#0d1526', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>مرحباً بك 👋</Text>
            <Text style={styles.title}>Find Your Campsite</Text>
          </View>
          <Pressable style={styles.avatarBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarEmoji}>⛺</Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <Pressable style={styles.searchBox} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Search campsites in Algeria...</Text>
          <View style={styles.searchArrow}>
            <Text style={styles.searchArrowText}>→</Text>
          </View>
        </Pressable>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[['🏕️', `${featured.length}+`, 'Campsites'], ['📍', '48', 'Wilayas'], ['⭐', '4.8', 'Rating']].map(([emoji, val, label]) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statEmoji}>{emoji}</Text>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Category pills */}
        <Text style={styles.sectionTitle}>Browse by Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Featured section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Campsites</Text>
          <Pressable onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.seeAll}>See all →</Text>
          </Pressable>
        </View>

        {/* Cards */}
        {loading ? (
          <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No campsites found in this category</Text>
          </View>
        ) : (
          filtered.map((item, i) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/campsite/${item.id}`)}
            >
              {/* Hero image */}
              <Image source={item.image} style={styles.cardImg} contentFit="cover" transition={400} />

              {/* Gradient overlay at bottom of image */}
              <LinearGradient
                colors={['transparent', 'rgba(15,23,42,0.92)']}
                style={styles.cardGradient}
              />

              {/* Tags overlaid on image */}
              <View style={styles.cardTopRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type?.toUpperCase()}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeStar}>★</Text>
                  <Text style={styles.ratingBadgeVal}>{item.rating}</Text>
                </View>
              </View>

              {/* Info overlaid at bottom of image */}
              <View style={styles.cardBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardLoc}>📍 {item.wilaya}  ·  {item.reviews} reviews</Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceVal}>{item.price.toLocaleString()}</Text>
                  <Text style={styles.priceSub}>DZD/night</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  container: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: '#64748b', fontSize: 13, letterSpacing: 0.3 },
  title: { color: '#f1f5f9', fontSize: 28, fontWeight: 'bold', marginTop: 2 },
  avatarBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#f97316',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f97316', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatarEmoji: { fontSize: 22 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#334155',
    marginBottom: 20, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchText: { flex: 1, color: '#475569', fontSize: 14 },
  searchArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center',
  },
  searchArrowText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  statsStrip: {
    flexDirection: 'row', backgroundColor: '#1e293b',
    borderRadius: 18, padding: 16, marginBottom: 28,
    borderWidth: 1, borderColor: '#1e3a5f',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 20 },
  statVal: { color: '#f97316', fontSize: 16, fontWeight: 'bold' },
  statLbl: { color: '#64748b', fontSize: 11 },

  catScroll: { marginBottom: 24, marginLeft: -20 },
  catContent: { paddingLeft: 20, paddingRight: 8, gap: 10 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1e293b', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  catChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  catEmoji: { fontSize: 15 },
  catLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  catLabelActive: { color: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' },
  seeAll: { color: '#f97316', fontSize: 14, fontWeight: '600' },

  card: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#1e3a5f',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardPressed: { transform: [{ scale: 0.975 }], opacity: 0.92 },
  cardImg: { width: '100%', height: 220 },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 130 },

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
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    backdropFilter: 'blur(8px)',
  },
  ratingBadgeStar: { color: '#fbbf24', fontSize: 13 },
  ratingBadgeVal: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  cardBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    padding: 16,
  },
  cardName: { color: '#f1f5f9', fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  cardLoc: { color: '#94a3b8', fontSize: 12 },
  priceBox: { alignItems: 'flex-end', minWidth: 80 },
  priceVal: { color: '#f97316', fontSize: 17, fontWeight: 'bold' },
  priceSub: { color: '#94a3b8', fontSize: 11 },

  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#64748b', fontSize: 14 },
});
