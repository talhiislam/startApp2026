import { StyleSheet, View, Text, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { API_URL } from '../../constants/api';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        Alert.alert('Success', 'Password updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to update password');
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
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <Text style={styles.cardSub}>Ensure your account is using a long, random password to stay secure.</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, loading && { opacity: 0.6 }]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Update Password</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { marginTop: 20, borderColor: 'rgba(239,68,68,0.3)' }]}>
          <Text style={[styles.cardTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <Text style={styles.cardSub}>Permanently delete your account and all associated data.</Text>
          <Pressable style={styles.deleteBtn} onPress={() => Alert.alert('Coming Soon', 'Account deletion will be available soon.')}>
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </Pressable>
        </View>
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
    backgroundColor: '#1e293b', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#334155'
  },
  cardTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardSub: { color: '#94a3b8', fontSize: 13, marginBottom: 20 },

  field: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155'
  },

  saveBtn: {
    backgroundColor: '#f97316', borderRadius: 12, padding: 14, alignItems: 'center',
    marginTop: 10
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)'
  },
  deleteBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
