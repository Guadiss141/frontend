// app/registro.tsx
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await signUp(name, email, password); // crea la cuenta, abre sesión y el layout redirige al home
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.box}>
        <Text style={styles.heading}>Crear cuenta</Text>
        <TextInput testID="register-name" style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
        <TextInput testID="register-email" style={styles.input} placeholder="Email" autoCapitalize="none"
          keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput testID="register-password" style={styles.input} placeholder="Contraseña (mín. 6)" secureTextEntry
          value={password} onChangeText={setPassword} />
        <TextInput testID="register-confirm" style={styles.input} placeholder="Repetir contraseña" secureTextEntry
          value={confirm} onChangeText={setConfirm} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable testID="register-submit" accessibilityRole="button" style={styles.button} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrarme</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.link}>Ya tengo cuenta</Text>
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