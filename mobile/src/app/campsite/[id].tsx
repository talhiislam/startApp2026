import {
  StyleSheet, View, ScrollView, Text, Pressable,
  ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { API_URL } from '../../constants/api';
import { apiFetch } from '../../lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export default function CampsiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [campsite, setCampsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'map'>('about');

  // Booking states
  const [checkInOffset, setCheckInOffset] = useState(1);
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    fetch(`${API_URL}/campsites/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const c = data.data;
          setCampsite({
            id: c._id,
            name: c.name,
            wilaya: c.wilaya,
            region: c.region,
            type: c.type,
            price: c.pricePerNight,
            rating: c.averageRating,
            reviews: c.reviewCount || 0,
            image: c.images?.[0] || 'https://images.unsplash.com/photo-1504280387937-31c402506e78?w=800&auto=format&fit=crop',
            description: c.description || 'No description available.',
            amenities: c.amenities || [],
            lat: c.coordinates?.lat,
            lng: c.coordinates?.lng,
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    setBooking(true);
    try {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + checkInOffset);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);

      const res = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({ siteId: id, checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), guests }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('🎉 Booking Confirmed!', 'Your trip is booked. Check My Trips for details.', [
          { text: 'View Trips', onPress: () => router.push('/(tabs)/trips') },
          { text: 'Stay Here', style: 'cancel' },
        ]);
      } else if (res.status === 401) {
        Alert.alert('Sign In Required', 'Please sign in to make a booking.', [
          { text: 'Sign In', onPress: () => router.push('/login') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Booking Failed', data.error || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Please check your connection and try again.');
    } finally {
      setBooking(false);
    }
  };

  const checkInDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + checkInOffset);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  })();

  const checkOutDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + checkInOffset + nights);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  })();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading campsite...</Text>
      </View>
    );
  }

  if (!campsite) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundEmoji}>🏕️</Text>
        <Text style={styles.notFoundText}>Campsite not found</Text>
        <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackText}>← Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ─── Hero Image ─── */}
        <View style={styles.hero}>
          <Image source={campsite.image} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.85)']}
            style={styles.heroGradient}
          />
          {/* Top controls */}
          <View style={[styles.heroTop, { paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingValue}>{campsite.rating}</Text>
              <Text style={styles.ratingReviews}>({campsite.reviews})</Text>
            </View>
          </View>
          {/* Bottom info overlaid on hero */}
          <View style={styles.heroBottom}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{campsite.type?.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroName}>{campsite.name}</Text>
            <Text style={styles.heroLoc}>📍 {campsite.wilaya}, {campsite.region}</Text>
          </View>
        </View>

        {/* ─── Content ─── */}
        <View style={styles.content}>

          {/* Price Strip */}
          <View style={styles.priceStrip}>
            <View>
              <Text style={styles.priceValue}>{campsite.price.toLocaleString()} <Text style={styles.priceCurrency}>DZD</Text></Text>
              <Text style={styles.priceLabel}>per night</Text>
            </View>
            <View style={styles.statsMini}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>★ {campsite.rating}</Text>
                <Text style={styles.miniStatLbl}>Rating</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>{campsite.reviews}</Text>
                <Text style={styles.miniStatLbl}>Reviews</Text>
              </View>
            </View>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            {['about', 'map'].map(tab => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab as 'about' | 'map')}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'about' ? '📋 About' : '🗺️ Location'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ─── About Tab ─── */}
          {activeTab === 'about' && (
            <>
              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About this campsite</Text>
                <Text style={styles.description}>{campsite.description}</Text>
              </View>

              {/* Amenities */}
              {campsite.amenities.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amenities</Text>
                  <View style={styles.amenitiesGrid}>
                    {campsite.amenities.map((a: string) => (
                      <View key={a} style={styles.amenityChip}>
                        <Text style={styles.amenityText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Booking Planner */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Plan your trip</Text>
                <View style={styles.bookingCard}>

                  {/* Check-in row */}
                  <View style={styles.bookingRow}>
                    <View>
                      <Text style={styles.bookingLabel}>Check-in</Text>
                      <Text style={styles.bookingDate}>{checkInDate}</Text>
                    </View>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepBtn} onPress={() => setCheckInOffset(o => Math.max(1, o - 1))}>
                        <Text style={styles.stepText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{`+${checkInOffset}d`}</Text>
                      <Pressable style={styles.stepBtn} onPress={() => setCheckInOffset(o => o + 1)}>
                        <Text style={styles.stepText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Check-out row */}
                  <View style={styles.bookingRow}>
                    <View>
                      <Text style={styles.bookingLabel}>Nights</Text>
                      <Text style={styles.bookingDate}>{checkOutDate} checkout</Text>
                    </View>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepBtn} onPress={() => setNights(n => Math.max(1, n - 1))}>
                        <Text style={styles.stepText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{nights} night{nights > 1 ? 's' : ''}</Text>
                      <Pressable style={styles.stepBtn} onPress={() => setNights(n => n + 1)}>
                        <Text style={styles.stepText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Guests row */}
                  <View style={[styles.bookingRow, { borderBottomWidth: 0 }]}>
                    <View>
                      <Text style={styles.bookingLabel}>Guests</Text>
                      <Text style={styles.bookingDate}>{guests} {guests === 1 ? 'person' : 'people'}</Text>
                    </View>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepBtn} onPress={() => setGuests(g => Math.max(1, g - 1))}>
                        <Text style={styles.stepText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>{guests}</Text>
                      <Pressable style={styles.stepBtn} onPress={() => setGuests(g => g + 1)}>
                        <Text style={styles.stepText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Price summary */}
                <View style={styles.priceSummary}>
                  <Text style={styles.priceSummaryText}>{campsite.price.toLocaleString()} DZD × {nights} night{nights > 1 ? 's' : ''}</Text>
                  <Text style={styles.priceSummaryTotal}>{(campsite.price * nights).toLocaleString()} DZD</Text>
                </View>
              </View>
            </>
          )}

          {/* ─── Map Tab ─── */}
          {activeTab === 'map' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Campsite Location</Text>
              {campsite.lat && campsite.lng ? (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                      latitude: campsite.lat,
                      longitude: campsite.lng,
                      latitudeDelta: 0.08,
                      longitudeDelta: 0.08,
                    }}
                  >
                    <Marker
                      coordinate={{ latitude: campsite.lat, longitude: campsite.lng }}
                      title={campsite.name}
                      description={`📍 ${campsite.wilaya}`}
                      pinColor="#f97316"
                    />
                  </MapView>
                  <View style={styles.mapInfoBar}>
                    <Text style={styles.mapInfoText}>📍 {campsite.wilaya}, {campsite.region}</Text>
                    <Text style={styles.mapCoords}>{campsite.lat.toFixed(4)}, {campsite.lng.toFixed(4)}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noMap}>
                  <Text style={styles.noMapEmoji}>🗺️</Text>
                  <Text style={styles.noMapText}>Location coordinates not available</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* ─── Sticky Footer ─── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.footerTotal}>{(campsite.price * nights).toLocaleString()} DZD</Text>
          <Text style={styles.footerSub}>Total · {nights} night{nights > 1 ? 's' : ''} · {guests} guest{guests > 1 ? 's' : ''}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, pressed && styles.bookBtnPressed, booking && { opacity: 0.7 }]}
          onPress={handleBook}
          disabled={booking}
        >
          {booking
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.bookText}>Book Now →</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14, marginTop: 8 },
  notFoundEmoji: { fontSize: 48 },
  notFoundText: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' },
  goBackBtn: { marginTop: 12, backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  goBackText: { color: '#fff', fontWeight: 'bold' },

  hero: { height: 340, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  heroTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  backText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  ratingStar: { color: '#fbbf24', fontSize: 14 },
  ratingValue: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  ratingReviews: { color: '#94a3b8', fontSize: 12 },

  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  typeBadge: {
    alignSelf: 'flex-start', backgroundColor: '#f97316',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10,
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  heroName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  heroLoc: { color: '#cbd5e1', fontSize: 14 },

  content: { padding: 20 },

  priceStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#334155', marginBottom: 20,
  },
  priceValue: { color: '#f97316', fontSize: 26, fontWeight: 'bold' },
  priceCurrency: { color: '#f97316', fontSize: 16 },
  priceLabel: { color: '#64748b', fontSize: 12, marginTop: 2 },
  statsMini: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  miniStat: { alignItems: 'center' },
  miniStatVal: { color: '#f1f5f9', fontSize: 16, fontWeight: 'bold' },
  miniStatLbl: { color: '#64748b', fontSize: 11, marginTop: 2 },
  miniDivider: { width: 1, height: 30, backgroundColor: '#334155' },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#1e293b',
    borderRadius: 14, padding: 4, marginBottom: 24,
    borderWidth: 1, borderColor: '#334155',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#f97316' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  section: { marginBottom: 26 },
  sectionTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: 'bold', marginBottom: 12 },
  description: { color: '#94a3b8', fontSize: 14, lineHeight: 24 },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: {
    backgroundColor: '#1e293b', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: '#334155',
  },
  amenityText: { color: '#e2e8f0', fontSize: 13 },

  bookingCard: {
    backgroundColor: '#1e293b', borderRadius: 18,
    borderWidth: 1, borderColor: '#334155',
    overflow: 'hidden',
  },
  bookingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  bookingLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  bookingDate: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center',
  },
  stepText: { color: '#f1f5f9', fontSize: 20, fontWeight: 'bold', lineHeight: 24 },
  stepVal: { color: '#f97316', fontSize: 14, fontWeight: 'bold', minWidth: 50, textAlign: 'center' },

  priceSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  priceSummaryText: { color: '#94a3b8', fontSize: 13 },
  priceSummaryTotal: { color: '#f97316', fontSize: 18, fontWeight: 'bold' },

  mapContainer: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  map: { width: '100%', height: 280 },
  mapInfoBar: {
    backgroundColor: '#1e293b', padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  mapInfoText: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  mapCoords: { color: '#64748b', fontSize: 11 },
  noMap: { alignItems: 'center', paddingVertical: 40, gap: 10, backgroundColor: '#1e293b', borderRadius: 18 },
  noMapEmoji: { fontSize: 40 },
  noMapText: { color: '#64748b', fontSize: 14 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16,
  },
  footerTotal: { color: '#f97316', fontSize: 20, fontWeight: 'bold' },
  footerSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  bookBtn: {
    backgroundColor: '#f97316', borderRadius: 16,
    paddingHorizontal: 28, paddingVertical: 15,
    shadowColor: '#f97316', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bookBtnPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  bookText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
