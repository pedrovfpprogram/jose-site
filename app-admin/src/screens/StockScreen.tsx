import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
}

export default function StockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o modal de Adicionar Novo Sabor
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, nome, preco, estoque')
      .order('nome');

    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar o estoque.');
    } else if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Adicionar novo sabor
  const handleAddProduct = async () => {
    if (!nome.trim() || !preco.trim() || !estoque.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('products').insert({
      nome: nome.trim(),
      preco: parseFloat(preco.replace(',', '.')),
      estoque: parseInt(estoque, 10),
    });

    setSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar o produto.');
    } else {
      Alert.alert('Sucesso!', 'Novo sabor cadastrado.');
      setNome('');
      setPreco('');
      setEstoque('');
      setIsModalOpen(false);
      fetchProducts();
    }
  };

  // Excluir sabor
  const handleDeleteProduct = (id: string, produtoNome: string) => {
    Alert.alert(
      'Excluir Sabor',
      `Deseja realmente apagar "${produtoNome}" do cardápio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
              Alert.alert('Erro', 'Não foi possível excluir o produto.');
            } else {
              fetchProducts();
            }
          } 
        }
      ]
    );
  };

  // Atualizar estoque (+ / -)
  const updateStock = async (id: string, currentStock: number, delta: number) => {
    const newStock = currentStock + delta;
    if (newStock < 0) return;

    const { error } = await supabase
      .from('products')
      .update({ estoque: newStock })
      .eq('id', id);

    if (!error) fetchProducts();
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <View style={styles.rowTitle}>
          <Text style={styles.productName}>{item.nome}</Text>
          <TouchableOpacity onPress={() => handleDeleteProduct(item.id, item.nome)}>
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.productPrice}>R$ {item.preco.toFixed(2)}</Text>
        <Text style={styles.stockText}>
          Estoque: <Text style={[styles.stockNumber, item.estoque === 0 && styles.outOfStock]}>{item.estoque} un.</Text>
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.btn, styles.btnRemove]} 
          onPress={() => updateStock(item.id, item.estoque, -1)}
        >
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.btnAdd]} 
          onPress={() => updateStock(item.id, item.estoque, 1)}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Gerenciar Estoque</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.newButtonText}>+ Novo Sabor</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><Text style={styles.loadingText}>Carregando...</Text></View>
      ) : products.length === 0 ? (
        <View style={styles.center}><Text style={styles.emptyText}>Nenhum dindim cadastrado.</Text></View>
      ) : (
        <FlatList data={products} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}

      {/* MODAL PARA ADICIONAR NOVO PRODUTO */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✨ Novo Sabor de Dindim</Text>
            
            <Text style={styles.label}>Nome do Sabor</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Ninho com Nutella" 
              placeholderTextColor="#94a3b8"
              value={nome} 
              onChangeText={setNome} 
            />

            <Text style={styles.label}>Preço (R$)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 4.50" 
              placeholderTextColor="#94a3b8"
              keyboardType="numeric" 
              value={preco} 
              onChangeText={setPreco} 
            />

            <Text style={styles.label}>Quantidade Inicial em Estoque</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 20" 
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad" 
              value={estoque} 
              onChangeText={setEstoque} 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Cadastrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  newButton: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  newButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  list: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontWeight: 'bold' },
  emptyText: { color: '#64748b', fontSize: 16 },
  
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  infoContainer: { flex: 1 },
  rowTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, paddingRight: 10 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  deleteText: { fontSize: 16 },
  productPrice: { fontSize: 14, color: '#16a34a', fontWeight: 'bold', marginBottom: 4 },
  stockText: { fontSize: 14, color: '#64748b' },
  stockNumber: { fontWeight: 'bold', color: '#0f172a' },
  outOfStock: { color: '#ef4444' },

  controls: { flexDirection: 'row', gap: 8 },
  btn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  btnAdd: { backgroundColor: '#16a34a' },
  btnRemove: { backgroundColor: '#ef4444' },
  btnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16, color: '#0f172a' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#16a34a', alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' }
});