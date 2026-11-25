// app/login.tsx
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password); // al iniciar sesión, el layout redirige al home
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.box}>
        <Text style={styles.heading}>Iniciar sesión</Text>
        <TextInput testID="login-email" style={styles.input} placeholder="Email" autoCapitalize="none"
          keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput testID="login-password" style={styles.input} placeholder="Contraseña" secureTextEntry
          value={password} onChangeText={setPassword} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable testID="login-submit" accessibilityRole="button" style={styles.button} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/registro')}>
          <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FB' },
  box: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  heading: { fontSize: 28, fontWeight: '900', color: '#172743', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#1D3151' },
  button: { backgroundColor: '#147D73', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  link: { color: '#147D73', fontWeight: '700', textAlign: 'center', marginTop: 8 },
  error: { color: '#A53D49', backgroundColor: '#FFF0F0', padding: 11, borderRadius: 10, fontWeight: '700', fontSize: 12 },
});