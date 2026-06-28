import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Fetch CSRF token for NextAuth
        const csrfRes = await fetch(`${API_URL}/auth/csrf`);
        const { csrfToken } = await csrfRes.json();

        // Call NextAuth credentials callback
        const res = await fetch(`${API_URL}/auth/callback/credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, csrfToken, redirect: false, json: 'true' }),
        });
        const data = await res.json();

        if (res.ok && data.url && !data.error) {
          // Success! Fetch session to get user info. React Native fetch keeps the HTTP-only cookie automatically.
          const sessionRes = await fetch(`${API_URL}/auth/session`);
          const session = await sessionRes.json();
          if (session?.user) {
            await AsyncStorage.setItem('user', JSON.stringify(session.user));
            router.replace('/(tabs)');
          } else {
            Alert.alert('Error', 'Failed to retrieve session');
          }
        } else {
          Alert.alert('Error', 'Invalid credentials');
        }
      } else {
        if (!name) { Alert.alert('Error', 'Please enter your name'); setLoading(false); return; }
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          // Automatically switch to login tab after successful signup
          Alert.alert('Success', 'Account created! Please sign in.');
          setIsLogin(true);
        } else {
          Alert.alert('Error', data.error || 'Registration failed');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Network Error', 'Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>⛺</Text>
        </View>
        <Text style={styles.appName}>SahaTour</Text>
        <Text style={styles.tagline}>Algeria's Premier Camping App</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Tab switch */}
        <View style={styles.tabRow}>
          <Pressable style={[styles.tab, isLogin && styles.tabActive]} onPress={() => setIsLogin(true)}>
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
          </Pressable>
          <Pressable style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => setIsLogin(false)}>
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
          </Pressable>
        </View>

        {/* Name field (signup only) */}
        {!isLogin && (
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Ahmed Benali"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {isLogin && (
          <Pressable style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, loading && styles.submitBtnLoading]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{isLogin ? 'Sign In →' : 'Create Account →'}</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.terms}>By continuing, you agree to our Terms & Privacy Policy</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, elevation: 12,
    shadowColor: '#f97316', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  logoEmoji: { fontSize: 36 },
  appName: { color: '#f1f5f9', fontSize: 30, fontWeight: 'bold' },
  tagline: { color: '#64748b', fontSize: 14, marginTop: 4 },

  card: {
    backgroundColor: '#1e293b', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#334155', marginBottom: 20,
  },

  tabRow: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 14, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#f97316' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  field: { marginBottom: 18 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155',
  },

  forgotBtn: { alignItems: 'flex-end', marginBottom: 20, marginTop: -6 },
  forgotText: { color: '#f97316', fontSize: 13 },

  submitBtn: {
    backgroundColor: '#f97316', borderRadius: 14, padding: 16, alignItems: 'center',
    elevation: 6, shadowColor: '#f97316', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  submitBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  submitBtnLoading: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  terms: { color: '#334155', textAlign: 'center', fontSize: 12 },
});
