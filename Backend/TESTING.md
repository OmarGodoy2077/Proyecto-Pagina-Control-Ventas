# Guía de Pruebas del Backend - Sales Inventory System

## 🚀 Endpoints Disponibles para Pruebas

### 1. Health Check
```bash
GET http://localhost:3000/api/health
```

### 2. Información General
```bash
GET http://localhost:3000/
```

## 🔐 Autenticación

### Registro de Usuario
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "first_name": "Test",
  "last_name": "User"
}
```

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

## 📦 Productos

### Crear Producto
```bash
POST http://localhost:3000/api/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Laptop HP",
  "description": "Laptop HP Pavilion 15",
  "sku": "HP-PAV-15-001",
  "stock": 10,
  "price": 799.99,
  "warranty_period_months": 12
}
```

### Obtener Productos
```bash
GET http://localhost:3000/api/products
Authorization: Bearer YOUR_JWT_TOKEN
```

## 👥 Clientes

### Crear Cliente
```bash
POST http://localhost:3000/api/customers
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City"
}
```

### Obtener Clientes
```bash
GET http://localhost:3000/api/customers
Authorization: Bearer YOUR_JWT_TOKEN
```

## 💰 Ventas

### Crear Venta
```bash
POST http://localhost:3000/api/sales
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "product_id": "PRODUCT_UUID_HERE",
  "customer_id": "CUSTOMER_UUID_HERE",
  "quantity": 1,
  "unit_price": 799.99
}
```

### Obtener Ventas
```bash
GET http://localhost:3000/api/sales
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📊 Estadísticas

### Dashboard
```bash
GET http://localhost:3000/api/stats/dashboard
Authorization: Bearer YOUR_JWT_TOKEN
```

### Reportes de Ventas
```bash
GET http://localhost:3000/api/stats/sales-report?period=week
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Usando cURL para Pruebas

### 1. Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

### 2. Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 3. Login (guarda el token)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "password123"
  }'
```

### 4. Crear producto (usa el token del login)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Laptop HP",
    "description": "Laptop HP Pavilion 15",
    "sku": "HP-PAV-15-001",
    "stock": 10,
    "price": 799.99,
    "warranty_period_months": 12
  }'
```

## 🔧 Herramientas Recomendadas

- **Postman**: Para pruebas interactivas
- **Insomnia**: Alternativa a Postman
- **cURL**: Para pruebas desde terminal
- **VS Code REST Client**: Extensión para VS Code

## 📝 Notas para Pruebas

1. **Primero registra un usuario** y haz login para obtener el JWT token
2. **Guarda el token** que recibes en el login para usarlo en otras peticiones
3. **Usa el token en el header** `Authorization: Bearer TOKEN`
4. **Verifica el estado** con `/api/health` antes de empezar
5. **Los UUIDs** se generan automáticamente, copia los que recibes en las respuestas

## 🐛 Troubleshooting

- Si recibes error 500, verifica que PostgreSQL esté corriendo
- Si recibes error 401, verifica que incluyas el token JWT
- Si recibes error de validación, verifica el formato de los datos
- Revisa los logs en la terminal donde corre el servidor