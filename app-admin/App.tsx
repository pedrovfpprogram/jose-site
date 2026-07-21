import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Button, Alert } from 'react-native';
import LiveOrdersScreen from './src/screens/LiveOrders';
import AddProductScreen from './src/screens/AddProduct';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // 🔒 Verifica a sessão atual usando o AsyncStorage configurado no lib/supabase.ts
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Função de Login Seguro do Admin
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Acesso Negado', 'Credenciais inválidas.');
    setLoading(false);
  }

  // 🚧 TELA DE LOGIN (Se não houver sessão ativa, trava o usuário aqui)
  if (!session) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <Text style={styles.loginTitle}>Acesso Restrito</Text>
        <TextInput 
          style={styles.input} 
          placeholder="E-mail de Administrador" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address"
        />
        <TextInput 
          style={styles.input} 
          placeholder="Senha" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
        <Button title={loading ? "Verificando..." : "Entrar no Sistema"} onPress={signInWithEmail} color="#16a34a" />
      </SafeAreaView>
    );
  }

  // ✅ PAINEL LIBERADO (Renderizado apenas se a sessão criptográfica for válida)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Dashboard Dindim</Text>
      </View>

      <View style={styles.content}>
        {activeTab === 'orders' ? <LiveOrdersScreen /> : <AddProductScreen />}
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'orders' && styles.activeNav]} 
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.navText, activeTab === 'orders' && { color: '#16a34a' }]}>Vendas ao Vivo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'products' && styles.activeNav]} 
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.navText, activeTab === 'products' && { color: '#16a34a' }]}>Lançar Dindim</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loginContainer: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  loginTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 8, backgroundColor: 'white' },
  header: { padding: 20, backgroundColor: '#16a34a', alignItems: 'center' },
  headerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1 },
  navBar: { flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderColor: '#e5e5e5' },
  navButton: { flex: 1, padding: 15, alignItems: 'center' },
  activeNav: { borderTopWidth: 3, borderColor: '#16a34a' },
  navText: { fontWeight: 'bold', color: '#666' }
});