import {
  StyleSheet, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetch as expoFetch } from 'expo/fetch';
import { API_URL } from '../../constants/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

const SUGGESTIONS = [
  'What are the best campsites in the Sahara?',
  'What gear do I need for desert camping?',
  'Best season to camp in Algeria?',
  'أنصحني بأفضل أماكن التخييم في الجزائر',
];

function InlineText({ text, style }: { text: string; style: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

function MarkdownText({ text, mine }: { text: string; mine: boolean }) {
  const lines = text.split('\n');
  const textStyle = mine ? styles.bubbleTextUser : styles.bubbleTextAI;
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      nodes.push(
        <InlineText key={i} text={heading[2]} style={[textStyle, styles.heading]} />,
      );
      i++;
      continue;
    }

    if (/^[*\-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[*\-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[*\-•]\s+/, ''));
        i++;
      }
      nodes.push(
        <View key={`ul-${i}`} style={styles.list}>
          {items.map((item, j) => (
            <View key={j} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: mine ? '#fff' : '#f97316' }]} />
              <InlineText text={item} style={[textStyle, styles.listText]} />
            </View>
          ))}
        </View>,
      );
      continue;
    }

    if (line.trim() === '') {
      nodes.push(<View key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    nodes.push(<InlineText key={i} text={line} style={textStyle} />);
    i++;
  }

  return <View>{nodes}</View>;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    const assistantIdx = nextMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await expoFetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snapshot = accumulated;
        setMessages((prev) =>
          prev.map((m, idx) => (idx === assistantIdx ? { ...m, content: snapshot, streaming: true } : m)),
        );
      }

      setMessages((prev) =>
        prev.map((m, idx) => (idx === assistantIdx ? { ...m, streaming: false } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m, idx) =>
          idx === assistantIdx
            ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>⛺</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>SahaTour AI</Text>
          <Text style={styles.headerSubtitle}>Your Algeria camping assistant</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {isEmpty ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Text style={{ fontSize: 32 }}>💬</Text>
            </View>
            <Text style={styles.emptyTitle}>Ask me anything about camping</Text>
            <Text style={styles.emptySubtitle}>
              I can help you find campsites and plan the perfect trip across Algeria.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggestionBtn} onPress={() => void send(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg, i) => (
            <View
              key={i}
              style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowAI]}
            >
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                {msg.streaming && msg.content === '' ? (
                  <ActivityIndicator size="small" color={msg.role === 'user' ? '#fff' : '#f97316'} />
                ) : (
                  <MarkdownText text={msg.content} mine={msg.role === 'user'} />
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask about camping in Algeria..."
          placeholderTextColor="#475569"
          value={input}
          onChangeText={setInput}
          multiline
          editable={!loading}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => void send()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f97316',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 18 },
  headerTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: 'bold' },
  headerSubtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },

  messages: { flex: 1 },
  messagesContent: { padding: 16, flexGrow: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  emptyTitle: { color: '#f1f5f9', fontSize: 19, fontWeight: 'bold', textAlign: 'center' },
  emptySubtitle: { color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12, paddingHorizontal: 12 },
  suggestionBtn: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  suggestionText: { color: '#94a3b8', fontSize: 13 },

  msgRow: { flexDirection: 'row', marginBottom: 12 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#f97316', borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderBottomLeftRadius: 4 },
  bubbleTextUser: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTextAI: { color: '#f1f5f9', fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: 'bold' },
  heading: { fontWeight: 'bold', fontSize: 15, marginTop: 4 },

  list: { marginVertical: 2 },
  listItem: { flexDirection: 'row', gap: 8, marginBottom: 3 },
  bullet: { width: 4, height: 4, borderRadius: 2, marginTop: 8 },
  listText: { flex: 1 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#1e293b', backgroundColor: '#0f172a',
  },
  input: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155',
    color: '#f1f5f9', fontSize: 14, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f97316',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#fff', fontSize: 16 },
});
