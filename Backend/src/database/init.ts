import { query } from './connection';

/**
 * Script de inicialización de la base de datos
 * Crea todas las tablas necesarias para el sistema
 */

/**
 * Crear tabla de usuarios (vendedores)
 */
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'seller',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Crear tabla de productos
 */
const createProductsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Crear tabla de clientes
 */
const createCustomersTable = `
  CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Crear tabla de ventas
 */
const createSalesTable = `
  CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price > 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    warranty_period_months INTEGER NOT NULL CHECK (warranty_period_months > 0),
    warranty_start DATE NOT NULL,
    warranty_end DATE NOT NULL,
    serial_number VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Crear tabla de imágenes de ventas
 */
const createSaleImagesTable = `
  CREATE TABLE IF NOT EXISTS sale_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('sealed', 'full_product', 'serial_number')),
    image_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Crear tabla de tokens de refresh
 */
const createRefreshTokensTable = `
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token_hash)
  );
`;

/**
 * Crear índices para optimizar consultas
 */
const createIndexes = `
  -- Índices para usuarios
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
  
  -- Índices para productos
  CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
  CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
  CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  
  -- Índices para clientes
  CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);
  
  -- Índices para ventas
  CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
  CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
  CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);
  CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
  CREATE INDEX IF NOT EXISTS idx_sales_warranty_end ON sales(warranty_end);
  
  -- Índices para imágenes de ventas
  CREATE INDEX IF NOT EXISTS idx_sale_images_sale_id ON sale_images(sale_id);
  CREATE INDEX IF NOT EXISTS idx_sale_images_type ON sale_images(image_type);
  
  -- Índices para refresh tokens
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
`;

/**
 * Función para crear triggers de updated_at
 */
const createUpdateTriggerFunction = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';
`;

/**
 * Crear triggers para actualizar updated_at automáticamente
 */
const createUpdateTriggers = `
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  DROP TRIGGER IF EXISTS update_products_updated_at ON products;
  CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
  CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
  CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

/**
 * Ejecuta la inicialización de la base de datos
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🚀 Iniciando configuración de base de datos...');

    // Crear tablas
    await query(createUsersTable);
    console.log('✅ Tabla users creada');

    await query(createProductsTable);
    console.log('✅ Tabla products creada');

    await query(createCustomersTable);
    console.log('✅ Tabla customers creada');

    await query(createSalesTable);
    console.log('✅ Tabla sales creada');

    await query(createSaleImagesTable);
    console.log('✅ Tabla sale_images creada');

    await query(createRefreshTokensTable);
    console.log('✅ Tabla refresh_tokens creada');

    // Crear función de trigger
    await query(createUpdateTriggerFunction);
    console.log('✅ Función de trigger creada');

    // Crear triggers
    await query(createUpdateTriggers);
    console.log('✅ Triggers creados');

    // Crear índices
    await query(createIndexes);
    console.log('✅ Índices creados');

    console.log('🎉 Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
};