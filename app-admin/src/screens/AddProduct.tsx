import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { z } from 'zod';

const productSchema = z.object({
  nome: z.string().min(3).max(50),
  preco: z.number().positive(),
  estoque: z.number().int().nonnegative()
});

export default function AddProductScreen() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');

  const handleAddProduct = async () => {
    const parsed = productSchema.safeParse({
      nome,
      preco: parseFloat(preco),
      estoque: parseInt(estoque, 10)
    });

    if (!parsed.success) {
      Alert.alert('Erro', 'Dados inválidos. Verifique o preço e estoque.');
      return;
    }

    const { error } = await supabase.from('products').insert([parsed.data]);

    if (error) {
      Alert.alert('Erro de Segurança', 'Falha ao registrar o produto.');
    } else {
      Alert.alert('Sucesso', 'Dindim do dia atualizado!');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Sabor (Ex: Ninho)" value={nome} onChangeText={setNome} />
      <TextInput placeholder="Preço (Ex: 3.50)" value={preco} onChangeText={setPreco} keyboardType="numeric" />
      <TextInput placeholder="Quantidade" value={estoque} onChangeText={setEstoque} keyboardType="numeric" />
      <Button title="Lançar Dindim do Dia" onPress={handleAddProduct} />
    </View>
  );
}