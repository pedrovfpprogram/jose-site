-- Criação de Tipos Seguros
CREATE TYPE user_role AS ENUM ('cliente', 'admin');
CREATE TYPE order_status AS ENUM ('pendente', 'preparando', 'saiu_para_entrega', 'entregue', 'cancelado');

-- Tabela de Perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'cliente'::user_role,
  nome TEXT NOT NULL,
  telefone TEXT
);

-- Tabela de Produtos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) CHECK (preco > 0) NOT NULL,
  estoque INT DEFAULT 0 CHECK (estoque >= 0),
  ativo BOOLEAN DEFAULT true
);

-- Tabela de Pedidos
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES profiles(id) NOT NULL,
  status order_status DEFAULT 'pendente'::order_status,
  endereco_entrega TEXT NOT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- APLICAÇÃO DE RLS (ROW LEVEL SECURITY)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler proprio perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Atualizar proprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Produtos visiveis para todos" ON products FOR SELECT USING (ativo = true);

CREATE POLICY "Cliente cria proprio pedido" ON orders FOR INSERT WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Cliente ve proprio pedido" ON orders FOR SELECT USING (auth.uid() = cliente_id);

CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admin gerencia produtos" ON products FOR ALL USING (is_admin());
CREATE POLICY "Admin gerencia pedidos" ON orders FOR ALL USING (is_admin());

-- Habilita o Realtime para o App Admin escutar os pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE orders;