import { StyleSheet, View, ScrollView, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { API_URL } from '../../constants/api';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_COLOR: Record<string, string> = {
  pending: '#f97316',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳', confirmed: '✅', completed: '🏁', cancelled: '❌',
};

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/bookings`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTrips(data.data.map((b: any) => {
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            return {
              id: b._id,
              campsite: b.site?.name || 'Unknown Campsite',
              wilaya: b.site?.wilaya || '',
              checkIn: checkIn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              checkOut: checkOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              status: b.status,
              price: b.totalPrice,
              nights,
              guests: b.guests,
            };
          }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(fetchTrips);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#0f172a', '#0d1526']} style={styles.headerGrad}>
        <Text style={styles.title}>My Trips</Text>
        <Text style={styles.subtitle}>Your booking history</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 60 }} />
        ) : trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏕️</Text>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySub}>Explore campsites and make your first booking!</Text>
          </View>
        ) : (
          trips.map(trip => {
            const color = STATUS_COLOR[trip.status] || '#64748b';
            const emoji = STATUS_EMOJI[trip.status] || '📋';
            return (
              <Pressable key={trip.id} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                {/* Color accent bar */}
                <View style={[styles.accentBar, { backgroundColor: color }]} />

                <View style={styles.cardInner}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.campName} numberOfLines={1}>{trip.campsite}</Text>
                      {trip.wilaya ? <Text style={styles.campWilaya}>📍 {trip.wilaya}</Text> : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                      <Text style={styles.statusEmoji}>{emoji}</Text>
                      <Text style={[styles.statusText, { color }]}>{trip.status}</Text>
                    </View>
                  </View>

                  {/* Date row */}
                  <View style={styles.dateRow}>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateLbl}>Check-in</Text>
                      <Text style={styles.dateVal}>{trip.checkIn}</Text>
                    </View>
                    <View style={styles.dateArrow}>
                      <Text style={styles.dateArrowText}>→</Text>
                    </View>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateLbl}>Check-out</Text>
                      <Text style={styles.dateVal}>{trip.checkOut}</Text>
                    </View>
                  </View>

                  {/* Footer row */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerInfo}>{trip.nights} night{trip.nights > 1 ? 's' : ''}  ·  {trip.guests} guest{trip.guests > 1 ? 's' : ''}</Text>
                    <Text style={styles.priceText}>{trip.price?.toLocaleString()} DZD</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  headerGrad: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { color: '#f1f5f9', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 4 },

  list: { padding: 20, gap: 16 },

  card: {
    borderRadius: 18, overflow: 'hidden', backgroundColor: '#1e293b',
    flexDirection: 'row',
    borderWidth: 1, borderColor: '#334155',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  accentBar: { width: 5 },
  cardInner: { flex: 1, padding: 16, gap: 12 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  campName: { color: '#f1f5f9', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  campWilaya: { color: '#64748b', fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  statusEmoji: { fontSize: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateBlock: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, padding: 10 },
  dateLbl: { color: '#64748b', fontSize: 10, fontWeight: '600', marginBottom: 3 },
  dateVal: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  dateArrow: { paddingHorizontal: 4 },
  dateArrowText: { color: '#334155', fontSize: 18, fontWeight: 'bold' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerInfo: { color: '#64748b', fontSize: 13 },
  priceText: { color: '#f97316', fontSize: 16, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: 'bold' },
  emptySub: { color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 240, lineHeight: 20 },
});
