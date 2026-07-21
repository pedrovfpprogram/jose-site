import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  cliente_id: string;
  status: string;
  total: number;
  quantidade: number;
  produto_nome: string;
  criado_em: string;
  profiles: { nome: string; telefone: string } | null;
}

export default function LiveOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(nome, telefone)')
      .order('criado_em', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
    if (data) setOrders(data as Order[]);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 🏆 Finaliza o pedido e soma exatamente 1 ponto por dindim comprado
  const handleCompleteOrder = async (order: Order) => {
    if (order.status === 'entregue') return;

    // 1. Atualiza o status do pedido para 'entregue'
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'entregue' })
      .eq('id', order.id);

    if (orderError) {
      Alert.alert('Erro', 'Não foi possível atualizar o status do pedido.');
      return;
    }

    // 2. Passa a quantidade do pedido como o total de pontos (1 ponto por unidade)
    const pontosGanhos = order.quantidade || 1;

    const { error: rpcError } = await supabase.rpc('add_points_to_user', {
      target_user_id: order.cliente_id,
      points_to_add: pontosGanhos
    });

    if (rpcError) {
      Alert.alert('Aviso', 'Pedido entregue, mas houve falha ao adicionar os pontos: ' + rpcError.message);
    } else {
      Alert.alert('Sucesso!', `Pedido finalizado! O cliente ganhou +${pontosGanhos} pontos.`);
    }

    fetchOrders();
  };

  const renderItem = ({ item }: { item: Order }) => {
    const isDone = item.status === 'entregue';
    const clienteNome = item.profiles?.nome || 'Cliente sem nome';
    const clienteTel = item.profiles?.telefone || 'Sem telefone cadastrado';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.id.slice(0, 6).toUpperCase()}</Text>
          <Text style={styles.timeText}>🕒 {formatTime(item.criado_em)}</Text>
        </View>

        <View style={styles.customerContainer}>
          <Text style={styles.customerName}>👤 {clienteNome}</Text>
          <Text style={styles.customerPhone}>📞 {clienteTel}</Text>
        </View>

        <View style={styles.productContainer}>
          <Text style={styles.productText}>
            {item.quantidade}x {item.produto_nome || 'Dindim'}
          </Text>
          <Text style={styles.totalText}>R$ {item.total?.toFixed(2)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.badge, { backgroundColor: isDone ? '#dcfce3' : '#fef3c7' }]}>
            <Text style={[styles.badgeText, { color: isDone ? '#16a34a' : '#d97706' }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionButton, isDone && { backgroundColor: '#cbd5e1' }]}
            onPress={() => handleCompleteOrder(item)}
            disabled={isDone}
          >
             <Text style={styles.actionButtonText}>{isDone ? 'Concluído' : '✅ Finalizar e Dar Pontos'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={orders} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.listContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  listContainer: { padding: 16, gap: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  timeText: { fontSize: 14, color: '#64748b', fontWeight: 'bold' },
  customerContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 8 },
  customerName: { fontSize: 16, color: '#0f172a', fontWeight: 'bold', marginBottom: 4 },
  customerPhone: { fontSize: 14, color: '#2563eb', fontWeight: 'bold' },
  productContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  productText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  totalText: { fontSize: 16, fontWeight: '900', color: '#16a34a' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  actionButton: { backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});