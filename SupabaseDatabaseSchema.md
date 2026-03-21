# Sari-Sari POS - Complete Supabase Database Schema

## 🚀 Quick Setup
1. Copy the entire SQL script below
2. Go to your Supabase Dashboard → SQL Editor
3. Paste and run the query
4. Wait for completion (approximately 10-15 seconds)

---

## 📋 Complete SQL Schema

```sql
-- ============================================
-- SARI-SARI POS - COMPLETE DATABASE SCHEMA
-- Version: 1.0.0
-- Date: 2026-03-21
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PART 1: AUTH & USER MANAGEMENT
-- ============================================

-- User Subscriptions Table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  payment_id VARCHAR(200),
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  daily_transaction_limit INTEGER DEFAULT 50,
  monthly_price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_plan CHECK (plan_type IN ('free', 'premium_lite', 'premium_pro', 'premium_unlimited')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'cancelled', 'trial'))
);

-- Daily Transactions Tracking Table
CREATE TABLE daily_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- User Profile Table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  store_name VARCHAR(200),
  store_address TEXT,
  store_phone VARCHAR(20),
  store_logo TEXT,
  tin VARCHAR(50), -- Tax Identification Number
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: MASTER PRODUCT DATABASE
-- ============================================

-- Product Categories (Filipino categories)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  name_tagalog VARCHAR(50),
  icon VARCHAR(10),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Products Table (Central repository for ALL Philippine products)
CREATE TABLE master_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtin VARCHAR(20) UNIQUE NOT NULL, -- Barcode (Global Trade Item Number)
  brand VARCHAR(100),
  product_name VARCHAR(200) NOT NULL,
  variant VARCHAR(100),
  size VARCHAR(50),
  category_id UUID REFERENCES product_categories(id),
  subcategory VARCHAR(100),
  description TEXT,
  suggested_retail_price DECIMAL(10, 2),
  suggested_cost_price DECIMAL(10, 2),
  manufacturer VARCHAR(100),
  distributor VARCHAR(100),
  country_of_origin VARCHAR(50),
  is_imported BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barcode Index Table (Fast lookup by barcode)
CREATE TABLE barcode_index (
  barcode VARCHAR(20) PRIMARY KEY,
  product_id UUID REFERENCES master_products(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: USER-SPECIFIC DATA TABLES
-- ============================================

-- User Products (Synced from master or manually added)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(50),
  barcodes TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  unit_type VARCHAR(20) DEFAULT 'piece',
  image TEXT,
  is_from_master BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_unit_type CHECK (unit_type IN ('piece', 'sachet', 'bottle', 'can', 'pack', 'box'))
);

-- Customers (Suki / Utang Management)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  email VARCHAR(100),
  credit_limit DECIMAL(10, 2) DEFAULT 0,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  total_purchases DECIMAL(10, 2) DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (Sales Records)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_type VARCHAR(20),
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
  amount_paid DECIMAL(10, 2) NOT NULL,
  change_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'gcash', 'maya', 'credit', 'bank_transfer')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('paid', 'unpaid', 'partial'))
);

-- Transaction Items (Line items)
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements (Inventory History)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  movement_type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_id VARCHAR(100), -- transaction_id or purchase_order_id
  reference_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_movement_type CHECK (movement_type IN ('in', 'out', 'adjustment', 'return', 'damage'))
);

-- ============================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================

-- Daily Transactions Indexes
CREATE INDEX idx_daily_transactions_user_date ON daily_transactions(user_id, date);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(end_date);

-- Master Products Indexes
CREATE INDEX idx_master_products_gtin ON master_products(gtin);
CREATE INDEX idx_master_products_brand ON master_products(brand);
CREATE INDEX idx_master_products_product_name ON master_products(product_name);
CREATE INDEX idx_master_products_category ON master_products(category_id);
CREATE INDEX idx_master_products_is_active ON master_products(is_active);

-- Barcode Index
CREATE INDEX idx_barcode_index_barcode ON barcode_index(barcode);

-- User Products Indexes
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_low_stock ON products(user_id, stock, min_stock);

-- Customers Indexes
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_balance ON customers(user_id, current_balance);
CREATE INDEX idx_customers_is_active ON customers(is_active);

-- Transactions Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX idx_transactions_synced ON transactions(synced);

-- Transaction Items Indexes
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);

-- Stock Movements Indexes
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- ============================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_transactions ENABLE ROW LEVEL SECURITY;

-- Daily Transactions Policies
CREATE POLICY "Users can view own daily transactions" ON daily_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- User Subscriptions Policies
-- ============================================
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- User Profiles Policies
-- ============================================
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- Master Products Policies (Read-only for authenticated users)
-- ============================================
CREATE POLICY "Authenticated users can read master_products" ON master_products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read product_categories" ON product_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read barcode_index" ON barcode_index
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- User Products Policies (Full access to own data)
-- ============================================
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Customers Policies
-- ============================================
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Transactions Policies
-- ============================================
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Transaction Items Policies
-- ============================================
CREATE POLICY "Users can view own transaction items" ON transaction_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transaction items" ON transaction_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own transaction items" ON transaction_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own transaction items" ON transaction_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

-- ============================================
-- Stock Movements Policies
-- ============================================
CREATE POLICY "Users can view own stock movements" ON stock_movements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock movements" ON stock_movements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 6: TRIGGERS AND FUNCTIONS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_products_updated_at 
  BEFORE UPDATE ON master_products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_transactions_updated_at 
  BEFORE UPDATE ON daily_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.transaction_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                              LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_number
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_number();

-- Update stock on transaction
CREATE OR REPLACE FUNCTION update_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Record stock movement
    INSERT INTO stock_movements (
        user_id,
        product_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reference_id,
        reference_type
    )
    SELECT 
        p.user_id,
        p.id,
        'out',
        NEW.quantity,
        p.stock + NEW.quantity,
        p.stock,
        NEW.transaction_id,
        'sale'
    FROM products p
    WHERE p.id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_sale
  AFTER INSERT ON transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_transaction();

-- Update customer balance on transaction
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_method = 'credit' AND NEW.payment_status = 'unpaid' THEN
        UPDATE customers
        SET current_balance = current_balance + NEW.final_amount,
            total_purchases = total_purchases + NEW.final_amount,
            last_purchase_date = NEW.timestamp
        WHERE id = NEW.customer_id;
    ELSIF NEW.payment_method = 'credit' AND NEW.payment_status = 'partial' THEN
        UPDATE customers
        SET current_balance = current_balance + (NEW.final_amount - NEW.amount_paid),
            total_purchases = total_purchases + NEW.final_amount,
            last_purchase_date = NEW.timestamp
        WHERE id = NEW.customer_id;
    ELSE
        UPDATE customers
        SET total_purchases = total_purchases + NEW.final_amount,
            last_purchase_date = NEW.timestamp
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance();

-- ============================================
-- PART 7: HELPER FUNCTIONS
-- ============================================

-- Check if user is premium
CREATE OR REPLACE FUNCTION is_premium(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan VARCHAR(20);
  user_status VARCHAR(20);
  user_end_date TIMESTAMPTZ;
BEGIN
  SELECT plan_type, status, end_date INTO user_plan, user_status, user_end_date
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

-- Get user's subscription plan
CREATE OR REPLACE FUNCTION get_user_plan(user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  user_plan VARCHAR(20);
BEGIN
  SELECT plan_type INTO user_plan
  FROM user_subscriptions
  WHERE user_id = $1
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(user_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's daily transaction limit
CREATE OR REPLACE FUNCTION get_daily_limit(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  SELECT daily_transaction_limit INTO v_limit
  FROM user_subscriptions
  WHERE user_id = $1 AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_limit, 50); -- Default to 50 for free tier
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get today's transaction count
CREATE OR REPLACE FUNCTION get_today_transaction_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count INTO v_count
  FROM daily_transactions
  WHERE user_id = $1 AND date = CURRENT_DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can make a transaction
CREATE OR REPLACE FUNCTION can_make_transaction(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  v_limit := get_daily_limit(user_id);
  
  -- -1 or very high number means unlimited
  IF v_limit >= 999999 OR v_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  v_count := get_today_transaction_count(user_id);
  
  RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment transaction count
CREATE OR REPLACE FUNCTION increment_transaction_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_transactions (user_id, date, count)
  VALUES ($1, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = daily_transactions.count + 1, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's remaining limits
CREATE OR REPLACE FUNCTION get_remaining_limits(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_plan VARCHAR(20);
  product_count INTEGER;
  customer_count INTEGER;
  daily_limit INTEGER;
  daily_count INTEGER;
  limits JSONB;
BEGIN
  user_plan := get_user_plan(user_id);
  daily_limit := get_daily_limit(user_id);
  daily_count := get_today_transaction_count(user_id);
  
  SELECT COUNT(*) INTO product_count FROM products WHERE user_id = $1;
  SELECT COUNT(*) INTO customer_count FROM customers WHERE user_id = $1;
  
  limits := jsonb_build_object(
    'plan', user_plan,
    'products_used', product_count,
    'customers_used', customer_count,
    'transactions_today', daily_count,
    'daily_limit', daily_limit
  );
  
  -- Add static limits based on plan if not in DB
  CASE user_plan
    WHEN 'free' THEN
      limits := limits || jsonb_build_object(
        'products_limit', 50,
        'customers_limit', 20
      );
    WHEN 'premium_lite' THEN
      limits := limits || jsonb_build_object(
        'products_limit', 500,
        'customers_limit', 200
      );
    WHEN 'premium_pro' THEN
      limits := limits || jsonb_build_object(
        'products_limit', 5000,
        'customers_limit', 1000
      );
    ELSE
      limits := limits || jsonb_build_object(
        'products_limit', 999999,
        'customers_limit', 999999
      );
  END CASE;
  
  RETURN limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 8: INITIAL DATA
-- ============================================

-- Insert product categories
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
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check all policies created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================
-- DATABASE SETUP COMPLETE!
-- ============================================
```

---

## ✅ Verification Checklist

After running the script, verify:

- [ ] All 10 tables created successfully
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Triggers working properly
- [ ] Helper functions installed
- [ ] Categories populated

## 🔧 Troubleshooting

| Error | Solution |
|-------|----------|
| `relation already exists` | Tables already created, skip or DROP first |
| `permission denied` | Run as superuser or use service role key |
| `extension not found` | Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` first |

---

**Database is now ready!** Connect your Vite app using:
- Project URL: `https://your-project.supabase.co`
- Anon Key: `your-anon-key`
