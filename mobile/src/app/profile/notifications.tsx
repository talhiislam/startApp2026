import { StyleSheet, View, Text, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [promoEnabled, setPromoEnabled] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Receive alerts on your device</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#f97316' }}
              thumbColor="#fff"
              value={pushEnabled}
              onValueChange={setPushEnabled}
            />
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Email Notifications</Text>
              <Text style={styles.rowSub}>Receive booking updates via email</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#f97316' }}
              thumbColor="#fff"
              value={emailEnabled}
              onValueChange={setEmailEnabled}
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Promotions & Offers</Text>
              <Text style={styles.rowSub}>Special discounts and news</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#f97316' }}
              thumbColor="#fff"
              value={promoEnabled}
              onValueChange={setPromoEnabled}
            />
          </View>
        </View>
      </View>
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
  
  content: { padding: 20 },
  sectionTitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4 },
  
  card: {
    backgroundColor: '#1e293b', borderRadius: 20,
    borderWidth: 1, borderColor: '#334155', overflow: 'hidden'
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16
  },
  rowTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '500', marginBottom: 2 },
  rowSub: { color: '#64748b', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#334155', marginLeft: 16 },
});
