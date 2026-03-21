# Sari-Sari POS - Supabase Database Schema

## Complete SQL Setup

Copy and paste this entire script into your Supabase SQL Editor:

```sql
-- ============================================
-- SARI-SARI POS - COMPLETE DATABASE SCHEMA
-- ============================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50),
  payment_id VARCHAR(100),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. MASTER PRODUCT DATABASE (Shared)
-- ============================================

-- Product Categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  name_tagalog VARCHAR(50),
  icon VARCHAR(10),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Products (Central repository)
CREATE TABLE master_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gtin VARCHAR(20) UNIQUE NOT NULL,
  brand VARCHAR(100),
  product_name VARCHAR(200) NOT NULL,
  variant VARCHAR(100),
  size VARCHAR(50),
  category_id UUID REFERENCES product_categories(id),
  description TEXT,
  suggested_retail_price DECIMAL(10, 2),
  suggested_cost_price DECIMAL(10, 2),
  manufacturer VARCHAR(100),
  distributor VARCHAR(100),
  country_of_origin VARCHAR(50),
  is_imported BOOLEAN DEFAULT false,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barcode Index
CREATE TABLE barcode_index (
  barcode VARCHAR(20) PRIMARY KEY,
  product_id UUID REFERENCES master_products(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. USER-SPECIFIC TABLES
-- ============================================

-- User Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(50),
  barcodes TEXT[],
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  is_from_master BOOLEAN DEFAULT false,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  credit_limit DECIMAL(10, 2) DEFAULT 0,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  change DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Items
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- 4. INDEXES
-- ============================================

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_master_products_gtin ON master_products(gtin);
CREATE INDEX idx_master_products_brand ON master_products(brand);
CREATE INDEX idx_barcode_index_barcode ON barcode_index(barcode);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Public read for master tables (all authenticated users)
CREATE POLICY "Authenticated users can read master_products" ON master_products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read product_categories" ON product_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read barcode_index" ON barcode_index
  FOR SELECT USING (auth.role() = 'authenticated');

-- User subscription policies
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- User products policies
CREATE POLICY "Users can manage own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- Customers policies
CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Transaction items policies
CREATE POLICY "Users can manage own transaction items" ON transaction_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_master_products_updated_at 
  BEFORE UPDATE ON master_products 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 7. INSERT DEFAULT CATEGORIES
-- ============================================

INSERT INTO product_categories (name, name_tagalog, icon, sort_order) VALUES
('Noodles', 'Pansit', '🍜', 1),
('Beverages', 'Inumin', '🥤', 2),
('Biscuits', 'Biskwit', '🍪', 3),
('Canned Goods', 'De-lata', '🥫', 4),
('Sachets', 'Sachet', '📦', 5),
('Cigarettes', 'Yosi', '🚬', 6),
('Candies', 'Kendi', '🍬', 7),
('Frozen Goods', 'Nakapreserba', '❄️', 8),
('Personal Care', 'Pansarili', '🧴', 9),
('Household', 'Pambahay', '🧹', 10),
('Rice & Grains', 'Bigas', '🍚', 11),
('Snacks', 'Merienda', '🍿', 12),
('Coffee & Creamer', 'Kape', '☕', 13),
('Detergent & Soap', 'Sabon', '🧼', 14);

-- ============================================
-- 8. INSERT SAMPLE MASTER PRODUCTS (Optional)
-- ============================================

-- Insert sample categories reference
-- You will add your actual product list here later

-- ============================================
-- 9. CREATE FUNCTIONS FOR PREMIUM CHECK
-- ============================================

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan VARCHAR(20);
  user_status VARCHAR(20);
  user_end_date TIMESTAMP;
BEGIN
  SELECT plan_id, status, end_date INTO user_plan, user_status, user_end_date
  FROM user_subscriptions
  WHERE user_id = $1
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF user_plan IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF user_status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  IF user_end_date IS NOT NULL AND user_end_date < NOW() THEN
    RETURN FALSE;
  END IF;
  
  RETURN user_plan != 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DATABASE READY!
-- ============================================
```
