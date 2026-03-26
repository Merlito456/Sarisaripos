# Sari-Sari POS - Supabase Database Schema

## Complete SQL Setup

Copy and paste this entire script into your Supabase SQL Editor:

```sql
-- ============================================
-- SARI-SARI POS - COMPLETE DATABASE SCHEMA (GOLDEN VERSION)
-- ============================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 0. SHARED FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 1. USER PROFILES & SUBSCRIPTIONS
-- ============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Store Info
  store_name VARCHAR(200),
  store_address TEXT,
  store_phone VARCHAR(20),
  store_logo TEXT,
  tin VARCHAR(50),
  
  -- App State
  inventory_enabled BOOLEAN DEFAULT TRUE,
  points INT DEFAULT 0,
  total_contributions INT DEFAULT 0,
  last_contribution_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- 2. MASTER PRODUCT DATABASE (Shared Catalog)
-- ============================================

-- Product Categories (Global)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  name_tagalog VARCHAR(50),
  icon VARCHAR(10),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Products (Central repository for all users)
CREATE TABLE master_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gtin VARCHAR(20) UNIQUE NOT NULL, -- Global Trade Item Number (Barcode)
  brand VARCHAR(100),
  product_name VARCHAR(200) NOT NULL,
  variant VARCHAR(100),
  size VARCHAR(50),
  category_id UUID REFERENCES product_categories(id),
  subcategory VARCHAR(100),
  description TEXT,
  suggested_retail_price DECIMAL(10, 2),
  suggested_cost_price DECIMAL(10, 2),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  manufacturer VARCHAR(100),
  distributor VARCHAR(100),
  country_of_origin VARCHAR(50),
  is_imported BOOLEAN DEFAULT false,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barcode Index (Maps multiple barcodes to one master product)
CREATE TABLE barcode_index (
  barcode VARCHAR(20) PRIMARY KEY,
  product_id UUID REFERENCES master_products(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Units (Tingi System / Packaging Units)
CREATE TABLE product_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_product_id UUID REFERENCES master_products(id) ON DELETE CASCADE NOT NULL,
  unit_name VARCHAR(50) NOT NULL, -- e.g., 'stick', 'pack', 'piece', 'sachet'
  unit_type VARCHAR(20) DEFAULT 'retail', -- 'retail' or 'wholesale'
  quantity DECIMAL(10, 2) DEFAULT 1, -- how many base units per this unit
  barcode VARCHAR(50),
  selling_price DECIMAL(10, 2) DEFAULT 0,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  stock_quantity DECIMAL(10, 2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Contributions (Rewarding users for adding to the catalog)
CREATE TABLE user_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  master_product_id UUID REFERENCES master_products(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES product_units(id),
  barcode VARCHAR(20) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  points_awarded INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. USER-SPECIFIC INVENTORY & CUSTOMERS
-- ============================================

-- User Inventory (Private to each store owner)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES product_units(id),
  
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(50),
  barcodes TEXT[] DEFAULT '{}'::TEXT[],
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  unit_type VARCHAR(20) DEFAULT 'piece', -- piece, sachet, bottle, etc.
  image TEXT,
  
  is_from_master BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_unit_type CHECK (unit_type IN ('piece', 'sachet', 'bottle', 'can', 'pack', 'box'))
);

-- Customers (Private to each store owner)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  email VARCHAR(100),
  notes TEXT,
  
  credit_limit DECIMAL(10, 2) DEFAULT 0,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  total_purchases DECIMAL(10, 2) DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TRANSACTIONS & REPORTING
-- ============================================

-- Sales Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  total_amount DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- cash, gcash, maya, credit
  payment_status VARCHAR(20) NOT NULL, -- paid, unpaid, partial
  amount_paid DECIMAL(10, 2) NOT NULL,
  change DECIMAL(10, 2) NOT NULL,
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items within a transaction
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Transaction Aggregates (For fast reporting)
CREATE TABLE daily_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  total_sales DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- 5. INDEXES
-- ============================================

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_master_products_gtin ON master_products(gtin);
CREATE INDEX idx_barcode_index_barcode ON barcode_index(barcode);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_daily_transactions_user_date ON daily_transactions(user_id, date);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own subscription" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own products" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own customers" ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own daily_stats" ON daily_transactions FOR ALL USING (auth.uid() = user_id);

-- Public read for master tables
CREATE POLICY "Authenticated users can read master_products" ON master_products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert master_products" ON master_products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update master_products" ON master_products FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read product_categories" ON product_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert product_categories" ON product_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read barcode_index" ON barcode_index FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert barcode_index" ON barcode_index FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read product_units" ON product_units FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert product_units" ON product_units FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update product_units" ON product_units FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own contributions" ON user_contributions FOR ALL USING (auth.uid() = user_id);

-- Transaction items policy (linked to transaction owner)
CREATE POLICY "Users can manage own transaction items" ON transaction_items FOR ALL USING (
  EXISTS (SELECT 1 FROM transactions WHERE transactions.id = transaction_items.transaction_id AND transactions.user_id = auth.uid())
);

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle stock updates on transaction
CREATE OR REPLACE FUNCTION update_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products 
    SET stock = stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_stock_on_sale ON transaction_items;
CREATE TRIGGER update_stock_on_sale
  AFTER INSERT ON transaction_items
  FOR EACH ROW EXECUTE PROCEDURE update_stock_on_transaction();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Update triggers for all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_master_products_updated_at ON master_products;
CREATE TRIGGER update_master_products_updated_at BEFORE UPDATE ON master_products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_units_updated_at ON product_units;
CREATE TRIGGER update_product_units_updated_at BEFORE UPDATE ON product_units FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_transactions_updated_at ON daily_transactions;
CREATE TRIGGER update_daily_transactions_updated_at BEFORE UPDATE ON daily_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 8. DEFAULT DATA
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
('Detergent & Soap', 'Sabon', '🧼', 14)
ON CONFLICT (name) DO NOTHING;
```
