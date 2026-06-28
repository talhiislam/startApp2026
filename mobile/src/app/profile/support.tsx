import { StyleSheet, View, Text, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { API_URL } from '../../constants/api';

const CATEGORIES = [
  { id: 'campsite', label: 'Campsite Issue' },
  { id: 'booking', label: 'Booking Problem' },
  { id: 'account', label: 'Account Issue' },
  { id: 'bug', label: 'App Bug' },
  { id: 'other', label: 'Other' }
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('campsite');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      Alert.alert('Error', 'Please provide more details (at least 10 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message }),
      });
      const data = await res.json();
      
      if (res.ok) {
        Alert.alert('Success', 'Your support request has been sent! We will contact you shortly.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to submit request');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>How can we help you today?</Text>

        <Text style={styles.label}>Select a Category</Text>
        <View style={styles.categories}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              style={[styles.catBtn, category === cat.id && styles.catBtnActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={[styles.catText, category === cat.id && styles.catTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Message Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe your issue in detail..."
          placeholderTextColor="#475569"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.8 }, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Request</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>Our team usually responds within 24 hours.</Text>
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
  
  content: { padding: 24 },
  intro: { color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  
  label: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 10 },
  
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  catBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155'
  },
  catBtnActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  catText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#fff' },

  input: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 16,
    color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155',
    minHeight: 120, marginBottom: 24
  },

  submitBtn: {
    backgroundColor: '#f97316', borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#f97316', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  footer: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
