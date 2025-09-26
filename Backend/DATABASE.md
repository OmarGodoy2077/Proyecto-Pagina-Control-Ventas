# Documentación de la Base de Datos

## 🗄️ Esquema de Base de Datos PostgreSQL

### Visión General

El sistema utiliza PostgreSQL con un diseño normalizado que garantiza integridad referencial y optimización de consultas. Todas las tablas utilizan UUIDs como claves primarias para mayor seguridad y escalabilidad.

## 📊 Diagrama de Relaciones

```
users (vendedores/admins)
├── 1:N → sales (vendedor_id)
└── 1:N → refresh_tokens (user_id)

customers (clientes)
└── 1:N → sales (customer_id)

products (productos)
└── 1:N → sales (product_id)

sales (ventas principales)
└── 1:N → sale_images (sale_id)
```

## 📋 Tablas Detalladas

### Tabla: `users`
**Propósito**: Almacena información de vendedores y administradores del sistema.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('seller', 'admin')) DEFAULT 'seller',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos Clave**:
- `id`: Identificador único UUID
- `email`: Email único del usuario (usado para login)
- `password_hash`: Contraseña hasheada con bcrypt (12 rounds)
- `role`: Rol del usuario ('seller' o 'admin')
- `is_active`: Flag para soft delete

**Índices**:
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

---

### Tabla: `products`
**Propósito**: Catálogo de productos disponibles para la venta.

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos Clave**:
- `sku`: Código único del producto (Stock Keeping Unit)
- `stock`: Cantidad disponible (no puede ser negativo)
- `price`: Precio unitario con 2 decimales
- `is_active`: Flag para soft delete (productos descontinuados)

**Índices**:
```sql
CREATE UNIQUE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_name ON products(name);
```

**Trigger de Stock Bajo**:
```sql
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= 10 AND OLD.stock > 10 THEN
        -- Aquí se podría implementar notificación automática
        RAISE NOTICE 'STOCK BAJO: Producto % tiene solo % unidades', NEW.name, NEW.stock;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_low_stock
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();
```

---

### Tabla: `customers`
**Propósito**: Base de datos de clientes que realizan compras.

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos Clave**:
- `email`: Email del cliente (único, opcional)
- `phone`: Teléfono de contacto
- `address`: Dirección completa del cliente

**Índices**:
```sql
CREATE UNIQUE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(first_name, last_name);
```

---

### Tabla: `sales` 
**Propósito**: Registro principal de todas las ventas realizadas.

```sql
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    warranty_period_months INTEGER DEFAULT 12 CHECK (warranty_period_months >= 0),
    warranty_start DATE NOT NULL,
    warranty_end DATE NOT NULL,
    serial_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos Clave**:
- `product_id`: FK a productos
- `customer_id`: FK a clientes  
- `seller_id`: FK a usuarios (vendedor)
- `quantity`: Cantidad vendida (positiva)
- `unit_price`: Precio unitario al momento de la venta
- `total_price`: Precio total calculado (quantity × unit_price)
- `warranty_period_months`: Período de garantía en meses
- `warranty_start/end`: Fechas de inicio y fin de garantía
- `serial_number`: Número de serie extraído por OCR

**Índices**:
```sql
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_seller_id ON sales(seller_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_warranty_end ON sales(warranty_end);
CREATE INDEX idx_sales_serial_number ON sales(serial_number);
```

**Trigger de Actualización de Stock**:
```sql
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Reducir stock cuando se hace una venta
    UPDATE products 
    SET stock = stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    -- Verificar que no quede stock negativo
    IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_sale();
```

---

### Tabla: `sale_images`
**Propósito**: Almacena referencias a imágenes asociadas con cada venta.

```sql
CREATE TABLE sale_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    image_type VARCHAR(20) CHECK (image_type IN ('sealed', 'full_product', 'serial_number')),
    image_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos Clave**:
- `sale_id`: FK a ventas (con CASCADE DELETE)
- `image_type`: Tipo de imagen ('sealed', 'full_product', 'serial_number')
- `image_url`: URL de la imagen (simulado con Cloudinary)

**Índices**:
```sql
CREATE INDEX idx_sale_images_sale_id ON sale_images(sale_id);
CREATE INDEX idx_sale_images_type ON sale_images(image_type);
```

**Constraint de Límite**:
```sql
-- Máximo 3 imágenes por venta (una de cada tipo)
CREATE UNIQUE INDEX idx_sale_images_unique_type 
ON sale_images(sale_id, image_type);
```

---

### Tabla: `refresh_tokens`
**Propósito**: Gestiona tokens de refresh JWT activos para autenticación.

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos Clave**:
- `user_id`: FK a usuarios (con CASCADE DELETE)
- `token_hash`: Hash del token de refresh
- `expires_at`: Fecha de expiración del token

**Índices**:
```sql
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

**Trigger de Limpieza Automática**:
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar tokens expirados al insertar uno nuevo
    DELETE FROM refresh_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Limitar a máximo 5 tokens activos por usuario
    DELETE FROM refresh_tokens 
    WHERE user_id = NEW.user_id 
    AND id NOT IN (
        SELECT id FROM refresh_tokens 
        WHERE user_id = NEW.user_id 
        ORDER BY created_at DESC 
        LIMIT 5
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_refresh_tokens
    AFTER INSERT ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_expired_tokens();
```

## 🔄 Triggers Automáticos

### 1. Actualización de `updated_at`
Todas las tablas tienen un trigger que actualiza automáticamente el campo `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicado a todas las tablas principales
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- (Similar para products, customers, sales)
```

### 2. Cálculo Automático de Garantías
```sql
CREATE OR REPLACE FUNCTION calculate_warranty_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular warranty_start como la fecha de venta
    NEW.warranty_start = NEW.sale_date::DATE;
    
    -- Calcular warranty_end sumando los meses de garantía
    NEW.warranty_end = (NEW.sale_date + INTERVAL '1 month' * NEW.warranty_period_months)::DATE;
    
    -- Calcular total_price
    NEW.total_price = NEW.quantity * NEW.unit_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_warranty_dates
    BEFORE INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION calculate_warranty_dates();
```

## 📈 Consultas de Rendimiento

### Consultas Optimizadas Frecuentes

#### 1. Productos con Stock Bajo
```sql
SELECT p.id, p.name, p.sku, p.stock, p.price
FROM products p
WHERE p.is_active = true AND p.stock <= 10
ORDER BY p.stock ASC;
```

#### 2. Garantías Próximas a Vencer
```sql
SELECT s.id, p.name as product_name, c.first_name, c.last_name,
       s.warranty_end, (s.warranty_end - CURRENT_DATE) as days_remaining
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN customers c ON s.customer_id = c.id
WHERE s.warranty_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY s.warranty_end ASC;
```

#### 3. Ventas por Vendedor (Mes Actual)
```sql
SELECT u.first_name, u.last_name, 
       COUNT(s.id) as total_sales,
       SUM(s.total_price) as total_revenue
FROM users u
LEFT JOIN sales s ON u.id = s.seller_id 
    AND s.sale_date >= DATE_TRUNC('month', CURRENT_DATE)
WHERE u.role = 'seller'
GROUP BY u.id, u.first_name, u.last_name
ORDER BY total_revenue DESC;
```

#### 4. Historial de Compras por Cliente
```sql
SELECT s.sale_date, p.name, s.quantity, s.unit_price, s.total_price,
       s.warranty_end, u.first_name as seller_name
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN users u ON s.seller_id = u.id
WHERE s.customer_id = $1
ORDER BY s.sale_date DESC;
```

## 🔍 Índices de Rendimiento

### Índices Compuestos para Consultas Frecuentes

```sql
-- Para filtros de ventas por fecha y vendedor
CREATE INDEX idx_sales_seller_date ON sales(seller_id, sale_date);

-- Para búsqueda de productos por estado y stock
CREATE INDEX idx_products_active_stock ON products(is_active, stock);

-- Para consultas de garantías por período
CREATE INDEX idx_sales_warranty_period ON sales(warranty_end, warranty_start);

-- Para búsqueda de clientes por nombre completo
CREATE INDEX idx_customers_fullname ON customers(first_name, last_name);
```

## 📊 Vistas Útiles

### Vista de Ventas Completas
```sql
CREATE VIEW sales_complete AS
SELECT 
    s.id,
    s.sale_date,
    p.name as product_name,
    p.sku,
    c.first_name || ' ' || c.last_name as customer_name,
    u.first_name || ' ' || u.last_name as seller_name,
    s.quantity,
    s.unit_price,
    s.total_price,
    s.warranty_start,
    s.warranty_end,
    CASE 
        WHEN s.warranty_end > CURRENT_DATE THEN 'Active'
        ELSE 'Expired'
    END as warranty_status
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN customers c ON s.customer_id = c.id
JOIN users u ON s.seller_id = u.id;
```

### Vista de Estadísticas de Inventario
```sql
CREATE VIEW inventory_stats AS
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE is_active = true) as active_products,
    COUNT(*) FILTER (WHERE stock <= 10 AND is_active = true) as low_stock_products,
    SUM(stock * price) FILTER (WHERE is_active = true) as total_inventory_value,
    AVG(stock) FILTER (WHERE is_active = true) as avg_stock_level
FROM products;
```

## 🔒 Políticas de Seguridad

### Row Level Security (RLS)
```sql
-- Habilitar RLS para ventas (vendedores solo ven sus propias ventas)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_seller_policy ON sales
FOR ALL TO seller_role
USING (seller_id = current_user_id());

-- Los administradores ven todo
CREATE POLICY sales_admin_policy ON sales
FOR ALL TO admin_role
USING (true);
```

## 🚀 Optimizaciones de Rendimiento

### 1. Particionamiento por Fecha (Futuro)
```sql
-- Para cuando el volumen de ventas crezca significativamente
CREATE TABLE sales_2024 PARTITION OF sales
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 2. Índices Parciales
```sql
-- Solo indexar productos activos
CREATE INDEX idx_products_active_name ON products(name) WHERE is_active = true;

-- Solo indexar garantías activas
CREATE INDEX idx_sales_active_warranties ON sales(warranty_end) 
WHERE warranty_end > CURRENT_DATE;
```

## 📋 Mantenimiento de Base de Datos

### Scripts de Limpieza
```sql
-- Limpiar tokens expirados (ejecutar diariamente)
DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;

-- Actualizar estadísticas (ejecutar semanalmente)
ANALYZE;

-- Reindexar tablas grandes (ejecutar mensualmente)
REINDEX TABLE sales;
```

### Backup y Restauración
```bash
# Backup completo
pg_dump -h localhost -U usuario -d sales_inventory_db > backup_$(date +%Y%m%d).sql

# Backup solo esquema
pg_dump -h localhost -U usuario -s -d sales_inventory_db > schema_backup.sql

# Restauración
psql -h localhost -U usuario -d sales_inventory_db < backup_file.sql
```

---

*Esta documentación se actualiza automáticamente con cada cambio en el esquema de base de datos.*