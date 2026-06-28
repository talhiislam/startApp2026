import { StyleSheet, View, Text, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { API_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setFullName(data.fullName || data.username || '');
          setPhone(data.phone || '');
          setCity(data.city || '');
        }
      })
      .catch(() => Alert.alert('Error', 'Could not load profile data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, city }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Update local storage so the profile tab reflects changes immediately
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.username = fullName || userObj.username;
          await AsyncStorage.setItem('user', JSON.stringify(userObj));
        }
        
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to the server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#f97316" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#475569"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 0555 12 34 56"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Algiers"
              placeholderTextColor="#475569"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </ScrollView>
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
  
  content: { padding: 24 },
  field: { marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155'
  },

  saveBtn: {
    backgroundColor: '#f97316', borderRadius: 14, padding: 16, alignItems: 'center',
    marginTop: 10, shadowColor: '#f97316', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
