// app-admin/src/screens/LiveOrders.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Order {
  id: string;
  cliente_id: string;
  status: string;
  endereco_entrega: string;
  total: number;
  criado_em: string;
}

export default function LiveOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  
  useEffect(() => {
    const fetchInitialOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(50); // Limita para não pesar o app

      if (error) {
         Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
         return;
      }
      if (data) setOrders(data);
    };

    fetchInitialOrders();

    const channel: RealtimeChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((currentOrders) => [newOrder, ...currentOrders]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Formata a data para exibir a hora do pedido (Ex: 14:30)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2', minute: '2' });
  };

  // Define a cor da "etiqueta" baseada no status do pedido
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return { bg: '#fef3c7', text: '#d97706' }; // Amarelo
      case 'preparando': return { bg: '#dbeafe', text: '#2563eb' }; // Azul
      case 'saiu_para_entrega': return { bg: '#e0e7ff', text: '#4f46e5' }; // Roxo
      case 'entregue': return { bg: '#dcfce3', text: '#16a34a' }; // Verde
      default: return { bg: '#f3f4f6', text: '#4b5563' }; // Cinza
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusColor(item.status);
    
    return (
      <View style={styles.card}>
        {/* Cabeçalho do Card */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.id.slice(0, 6).toUpperCase()}</Text>
          <Text style={styles.timeText}>🕒 {formatTime(item.criado_em)}</Text>
        </View>

        {/* Corpo do Card (Endereço) */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>ENTREGAR EM:</Text>
          <Text style={styles.addressText} numberOfLines={2}>{item.endereco_entrega}</Text>
        </View>

        {/* Rodapé do Card (Status) */}
        <View style={styles.cardFooter}>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.actionButton}>
             <Text style={styles.actionButtonText}>Avançar Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>🟢 {orders.length} Pedidos localizados</Text>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>😴</Text>
            <Text style={styles.emptyStateText}>Nenhum pedido recebido ainda.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  summaryBar: { padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  summaryText: { fontWeight: '600', color: '#475569' },
  listContainer: { padding: 16, gap: 16 },
  
  // Estilo do Card Elevado
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    // Sombras para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Sombras para Android
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  timeText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  
  addressContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 },
  addressLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
  addressText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  
  actionButton: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateEmoji: { fontSize: 48, marginBottom: 10 },
  emptyStateText: { fontSize: 16, color: '#64748b' }
});