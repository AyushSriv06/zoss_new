/*
  # User Management System Schema

  1. New Tables
    - `users` - User profiles linked to auth.users
    - `master_products` - Product catalog managed by admin
    - `user_products` - Products owned by users
    - `services` - Service schedules and tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Admin-only access for master_products management

  3. Functions
    - Automatic user profile creation on signup
    - Service due date calculations
*/

-- Users table for additional profile information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Master products catalog (admin managed)
CREATE TABLE IF NOT EXISTS master_products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  description text,
  image_url text,
  warranty_period_months integer DEFAULT 12,
  standard_service_interval_months integer DEFAULT 6,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User-owned products
CREATE TABLE IF NOT EXISTS user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  master_product_id uuid REFERENCES master_products(product_id) ON DELETE CASCADE,
  purchase_date date NOT NULL,
  serial_number text,
  amc_valid_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service tracking
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_product_id uuid REFERENCES user_products(id) ON DELETE CASCADE,
  service_date date,
  next_service_due_date date,
  status text DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Due Soon', 'Overdue', 'Completed')),
  notification_sent boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Master products policies (read for all, write for admins)
CREATE POLICY "Anyone can read master products"
  ON master_products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage master products"
  ON master_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- User products policies
CREATE POLICY "Users can read own products"
  ON user_products
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own products"
  ON user_products
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all user products"
  ON user_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Services policies
CREATE POLICY "Users can read own services"
  ON services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_products 
      WHERE user_products.id = services.user_product_id 
      AND user_products.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin users policies
CREATE POLICY "Admins can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update service status based on due dates
CREATE OR REPLACE FUNCTION update_service_status()
RETURNS void AS $$
BEGIN
  UPDATE services 
  SET status = CASE
    WHEN next_service_due_date < CURRENT_DATE THEN 'Overdue'
    WHEN next_service_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due Soon'
    ELSE 'Upcoming'
  END
  WHERE status != 'Completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data
INSERT INTO master_products (model_name, description, image_url, warranty_period_months, standard_service_interval_months) VALUES
('Zoss Countertop Ionizer', 'Compact alkaline water ionizer perfect for kitchens', '/lovable-uploads/622f2f9b-d2f1-4f0c-ac4f-656dca514723.png', 60, 6),
('Zoss Under-Sink Ionizer', 'Hidden installation ionizer with high flow rate', '/lovable-uploads/e2461f2f-96be-4a69-ad60-df4433dd50ce.png', 84, 6),
('Zoss Atlanta', 'Premium commercial-grade ionizer', '/lovable-uploads/91d71d34-d5aa-44bb-8185-e5698d380783.png', 120, 3);