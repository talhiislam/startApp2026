import { StyleSheet, View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ gap: 20 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardType}>Visa</Text>
            <Text style={styles.cardBadge}>Default</Text>
          </View>
          <Text style={styles.cardNumber}>**** **** **** 4242</Text>
          <Text style={styles.cardExpiry}>Expires 12/28</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#1e293b' }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardType}>Edahabia (Poste)</Text>
          </View>
          <Text style={styles.cardNumber}>**** **** **** 1982</Text>
          <Text style={styles.cardExpiry}>Expires 05/27</Text>
        </View>

        <Pressable 
          style={styles.addBtn}
          onPress={() => Alert.alert('Coming Soon', 'Adding new cards will be available in the next release.')}
        >
          <Text style={styles.addBtnText}>+ Add New Payment Method</Text>
        </Pressable>
      </ScrollView>
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
  
  card: {
    backgroundColor: '#3b82f6', borderRadius: 20, padding: 24,
    shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardType: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontStyle: 'italic' },
  cardBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardNumber: { color: '#fff', fontSize: 22, fontWeight: '500', letterSpacing: 2, marginBottom: 8 },
  cardExpiry: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },

  addBtn: {
    backgroundColor: 'transparent', borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 2, borderColor: '#334155', borderStyle: 'dashed', marginTop: 10
  },
  addBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
});
