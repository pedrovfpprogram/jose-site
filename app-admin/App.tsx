// app-admin/App.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import LiveOrdersScreen from './src/screens/LiveOrders';
import StockScreen from './src/screens/StockScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'orders' | 'stock'>('orders');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Conteúdo da Tela Ativa */}
      <View style={styles.content}>
        {currentTab === 'orders' ? <LiveOrdersScreen /> : <StockScreen />}
      </View>

      {/* Barra de Navegação Inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'orders' && styles.activeTab]} 
          onPress={() => setCurrentTab('orders')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, currentTab === 'orders' && styles.activeTabText]}>
            ⚡ Vendas ao Vivo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'stock' && styles.activeTab]} 
          onPress={() => setCurrentTab('stock')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, currentTab === 'stock' && styles.activeTabText]}>
            📦 Estoque
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  content: { 
    flex: 1 
  },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    borderTopWidth: 1, 
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: { 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#f8fafc'
  },
  activeTab: { 
    backgroundColor: '#dcfce3',
    borderColor: '#bbf7d0',
    borderWidth: 1
  },
  tabText: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#64748b' 
  },
  activeTabText: { 
    color: '#15803d' 
  }
});