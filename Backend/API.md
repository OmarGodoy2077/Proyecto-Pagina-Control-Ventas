# Documentación de la API REST

## 🚀 API Overview

La API está construida con Express.js y TypeScript, siguiendo patrones RESTful y mejores prácticas de seguridad. Todas las respuestas están en formato JSON y siguen una estructura consistente.

### Base URL
```
http://localhost:3000/api
```

### Estructura de Respuestas
```typescript
// Respuesta exitosa
{
  "success": true,
  "data": any,
  "message"?: string
}

// Respuesta de error
{
  "success": false,
  "error": {
    "message": string,
    "details"?: any
  }
}

// Respuesta con paginación
{
  "success": true,
  "data": any[],
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "totalItems": number,
    "itemsPerPage": number
  }
}
```

### Headers Requeridos
```
Content-Type: application/json
Authorization: Bearer <access_token> (para endpoints protegidos)
```

## 🔐 Autenticación

### POST /auth/register
Registra un nuevo usuario en el sistema.

**Acceso**: Público

**Body**:
```json
{
  "email": "vendedor@ejemplo.com",
  "password": "contraseña123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "seller" // "seller" | "admin"
}
```

**Validaciones**:
- Email válido y único
- Contraseña mínimo 6 caracteres
- Nombres no vacíos
- Role válido

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "vendedor@ejemplo.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "role": "seller",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  },
  "message": "Usuario registrado exitosamente"
}
```

---

### POST /auth/login
Inicia sesión en el sistema.

**Acceso**: Público

**Body**:
```json
{
  "email": "vendedor@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "vendedor@ejemplo.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "role": "seller"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

**Cookies Establecidas**:
```
refreshToken=jwt_refresh_token; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

---

### POST /auth/refresh
Renueva el access token usando el refresh token.

**Acceso**: Requiere refresh token válido en cookies

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

---

### POST /auth/logout
Cierra sesión y revoca el refresh token.

**Acceso**: Requiere autenticación

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### GET /auth/me
Obtiene información del usuario autenticado.

**Acceso**: Requiere autenticación

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "vendedor@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "seller",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### POST /auth/change-password
Cambia la contraseña del usuario autenticado.

**Acceso**: Requiere autenticación

**Body**:
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

## 📦 Productos

### GET /products
Lista productos con filtros opcionales.

**Acceso**: Requiere autenticación

**Query Parameters**:
```
?page=1                    # Página (default: 1)
&limit=10                  # Items por página (default: 10, max: 100)
&search=texto              # Búsqueda en nombre y descripción
&active=true               # Filtrar por estado activo
&lowStock=true             # Solo productos con stock <= 10
&minPrice=100              # Precio mínimo
&maxPrice=500              # Precio máximo
&sortBy=name               # Campo ordenamiento (name, price, stock, created_at)
&sortOrder=asc             # Orden (asc, desc)
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Smartphone XYZ",
      "description": "Smartphone de última generación",
      "sku": "PHONE-XYZ-001",
      "stock": 45,
      "price": 599.99,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "itemsPerPage": 10
  }
}
```

---

### GET /products/:id
Obtiene un producto específico por ID.

**Acceso**: Requiere autenticación

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Smartphone XYZ",
    "description": "Smartphone de última generación",
    "sku": "PHONE-XYZ-001",
    "stock": 45,
    "price": 599.99,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### POST /products
Crea un nuevo producto.

**Acceso**: Requiere autenticación + rol admin

**Body**:
```json
{
  "name": "Smartphone XYZ",
  "description": "Smartphone de última generación",
  "sku": "PHONE-XYZ-001",
  "stock": 50,
  "price": 599.99
}
```

**Validaciones**:
- Name: requerido, máximo 255 caracteres
- SKU: requerido, único, máximo 100 caracteres
- Stock: entero >= 0
- Price: decimal >= 0

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Smartphone XYZ",
    "description": "Smartphone de última generación",
    "sku": "PHONE-XYZ-001",
    "stock": 50,
    "price": 599.99,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Producto creado exitosamente"
}
```

---

### PUT /products/:id
Actualiza un producto existente.

**Acceso**: Requiere autenticación + rol admin

**Body**: (todos los campos opcionales)
```json
{
  "name": "Smartphone XYZ Pro",
  "description": "Versión mejorada",
  "stock": 75,
  "price": 699.99
}
```

**Nota**: El SKU no se puede modificar una vez creado.

---

### DELETE /products/:id
Desactiva un producto (soft delete).

**Acceso**: Requiere autenticación + rol admin

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Producto desactivado exitosamente"
}
```

---

### GET /products/low-stock
Lista productos con stock bajo (≤ 10 unidades).

**Acceso**: Requiere autenticación

**Query Parameters**: Mismos que GET /products (excepto lowStock)

---

### POST /products/:id/adjust-stock
Ajusta manualmente el stock de un producto.

**Acceso**: Requiere autenticación + rol admin

**Body**:
```json
{
  "adjustment": -5,           # Puede ser positivo o negativo
  "reason": "Inventario físico"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "previous_stock": 50,
    "new_stock": 45,
    "adjustment": -5,
    "reason": "Inventario físico"
  },
  "message": "Stock ajustado exitosamente"
}
```

## 👥 Clientes

### GET /customers
Lista clientes con filtros opcionales.

**Acceso**: Requiere autenticación

**Query Parameters**:
```
?page=1                    # Página
&limit=10                  # Items por página
&search=texto              # Búsqueda en nombre y email
&sortBy=first_name         # Campo ordenamiento
&sortOrder=asc             # Orden
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "María",
      "last_name": "González",
      "email": "maria@ejemplo.com",
      "phone": "+1234567890",
      "address": "Calle Principal 123",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { }
}
```

---

### GET /customers/:id
Obtiene un cliente específico.

**Acceso**: Requiere autenticación

---

### POST /customers
Crea un nuevo cliente.

**Acceso**: Requiere autenticación

**Body**:
```json
{
  "first_name": "María",
  "last_name": "González",
  "email": "maria@ejemplo.com",      // Opcional pero único
  "phone": "+1234567890",            // Opcional
  "address": "Calle Principal 123"   // Opcional
}
```

**Validaciones**:
- first_name, last_name: requeridos, máximo 100 caracteres
- email: formato válido, único si se proporciona
- phone: máximo 20 caracteres

---

### PUT /customers/:id
Actualiza un cliente existente.

**Acceso**: Requiere autenticación (Admin o vendedor que creó al cliente)

---

### DELETE /customers/:id
Elimina un cliente (solo si no tiene ventas asociadas).

**Acceso**: Requiere autenticación + rol admin

---

### GET /customers/:id/sales
Obtiene el historial de compras de un cliente.

**Acceso**: Requiere autenticación

**Query Parameters**:
```
?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sale_date": "2024-01-15T10:30:00Z",
      "product_name": "Smartphone XYZ",
      "sku": "PHONE-XYZ-001",
      "quantity": 1,
      "unit_price": 599.99,
      "total_price": 599.99,
      "warranty_start": "2024-01-15",
      "warranty_end": "2025-01-15",
      "seller_name": "Juan Pérez"
    }
  ],
  "pagination": { }
}
```

---

### GET /customers/:id/statistics
Obtiene estadísticas de compras del cliente.

**Acceso**: Requiere autenticación

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "total_purchases": 5,
    "total_spent": 2999.95,
    "average_purchase": 599.99,
    "first_purchase": "2024-01-15T10:30:00Z",
    "last_purchase": "2024-03-20T14:45:00Z",
    "favorite_products": [
      {
        "product_name": "Smartphone XYZ",
        "times_purchased": 2,
        "total_spent": 1199.98
      }
    ]
  }
}
```

## 🛒 Ventas

### GET /sales
Lista ventas con filtros opcionales.

**Acceso**: Requiere autenticación (vendedores ven solo sus ventas)

**Query Parameters**:
```
?page=1
&limit=10
&startDate=2024-01-01         # Filtro por fecha inicio
&endDate=2024-12-31           # Filtro por fecha fin
&productId=uuid               # Filtro por producto
&customerId=uuid              # Filtro por cliente
&sellerId=uuid                # Filtro por vendedor (solo admin)
&minAmount=100                # Monto mínimo
&maxAmount=1000               # Monto máximo
&hasWarranty=true             # Solo con garantía activa
&sortBy=sale_date             # Campo ordenamiento
&sortOrder=desc               # Orden
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sale_date": "2024-01-15T10:30:00Z",
      "product": {
        "id": "uuid",
        "name": "Smartphone XYZ",
        "sku": "PHONE-XYZ-001"
      },
      "customer": {
        "id": "uuid",
        "first_name": "María",
        "last_name": "González",
        "email": "maria@ejemplo.com"
      },
      "seller": {
        "id": "uuid",
        "first_name": "Juan",
        "last_name": "Pérez"
      },
      "quantity": 1,
      "unit_price": 599.99,
      "total_price": 599.99,
      "warranty_period_months": 12,
      "warranty_start": "2024-01-15",
      "warranty_end": "2025-01-15",
      "serial_number": "SN123456789",
      "notes": "Venta con descuento especial"
    }
  ],
  "pagination": { }
}
```

---

### GET /sales/:id
Obtiene una venta específica con todas sus imágenes.

**Acceso**: Requiere autenticación

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sale_date": "2024-01-15T10:30:00Z",
    "product": { },
    "customer": { },
    "seller": { },
    "quantity": 1,
    "unit_price": 599.99,
    "total_price": 599.99,
    "warranty_period_months": 12,
    "warranty_start": "2024-01-15",
    "warranty_end": "2025-01-15",
    "serial_number": "SN123456789",
    "notes": "Venta con descuento especial",
    "images": [
      {
        "id": "uuid",
        "image_type": "sealed",
        "image_url": "https://res.cloudinary.com/demo/image/sealed_abc123.jpg",
        "uploaded_at": "2024-01-15T10:35:00Z"
      },
      {
        "id": "uuid", 
        "image_type": "full_product",
        "image_url": "https://res.cloudinary.com/demo/image/product_def456.jpg",
        "uploaded_at": "2024-01-15T10:36:00Z"
      },
      {
        "id": "uuid",
        "image_type": "serial_number", 
        "image_url": "https://res.cloudinary.com/demo/image/serial_ghi789.jpg",
        "uploaded_at": "2024-01-15T10:37:00Z"
      }
    ]
  }
}
```

---

### POST /sales
Registra una nueva venta.

**Acceso**: Requiere autenticación

**Body**:
```json
{
  "product_id": "uuid",
  "customer_id": "uuid", 
  "quantity": 1,
  "unit_price": 599.99,              // Opcional, se toma del producto
  "warranty_period_months": 12,       // Opcional, default 12
  "notes": "Venta con descuento"      // Opcional
}
```

**Validaciones**:
- product_id: debe existir y estar activo
- customer_id: debe existir
- quantity: entero > 0
- unit_price: decimal >= 0
- warranty_period_months: entero >= 0

**Procesos Automáticos**:
- Calcula warranty_start y warranty_end
- Calcula total_price (quantity × unit_price)
- Reduce stock del producto
- Asigna seller_id del usuario autenticado

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sale_date": "2024-01-15T10:30:00Z",
    "product_id": "uuid",
    "customer_id": "uuid",
    "seller_id": "uuid",
    "quantity": 1,
    "unit_price": 599.99,
    "total_price": 599.99,
    "warranty_period_months": 12,
    "warranty_start": "2024-01-15",
    "warranty_end": "2025-01-15",
    "notes": "Venta con descuento"
  },
  "message": "Venta registrada exitosamente"
}
```

---

### POST /sales/:id/images
Sube imágenes asociadas a una venta.

**Acceso**: Requiere autenticación

**Content-Type**: `multipart/form-data`

**Form Fields**:
```
sealed: File           # Imagen del producto sellado (opcional)
full_product: File     # Imagen del producto completo (opcional)
serial_number: File    # Imagen del número de serie (opcional)
```

**Validaciones**:
- Máximo 3 archivos (uno por tipo)
- Formatos permitidos: JPG, JPEG, PNG, WebP
- Tamaño máximo: 5MB por archivo
- Solo el vendedor de la venta o admin puede subir imágenes

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "uploaded_images": [
      {
        "id": "uuid",
        "image_type": "sealed",
        "image_url": "https://res.cloudinary.com/demo/image/sealed_abc123.jpg",
        "uploaded_at": "2024-01-15T10:35:00Z"
      },
      {
        "id": "uuid",
        "image_type": "serial_number",
        "image_url": "https://res.cloudinary.com/demo/image/serial_ghi789.jpg", 
        "uploaded_at": "2024-01-15T10:37:00Z"
      }
    ]
  },
  "message": "Imágenes subidas exitosamente"
}
```

---

### POST /sales/:id/extract-serial
Extrae el número de serie de la imagen usando OCR.

**Acceso**: Requiere autenticación

**Prerrequisitos**: Debe existir una imagen de tipo 'serial_number' para la venta

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "extracted_serial": "SN123456789",
    "confidence": 0.95,
    "image_used": "https://res.cloudinary.com/demo/image/serial_ghi789.jpg"
  },
  "message": "Número de serie extraído exitosamente"
}
```

**Nota**: Actualmente retorna un número de serie simulado. Se puede integrar con Tesseract.js o Google Vision API.

## 📊 Estadísticas y Reportes

### GET /stats/dashboard
Obtiene métricas principales para el dashboard.

**Acceso**: Requiere autenticación

**Query Parameters**:
```
?period=month              # month, week, year (default: month)
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "current_period": {
      "total_sales": 125,
      "total_revenue": 74999.75,
      "average_sale": 599.99,
      "unique_customers": 45,
      "products_sold": 125
    },
    "previous_period": {
      "total_sales": 98,
      "total_revenue": 58999.02,
      "average_sale": 602.03,
      "unique_customers": 38,
      "products_sold": 98
    },
    "growth": {
      "sales_growth": 27.55,          # % crecimiento
      "revenue_growth": 27.12,
      "customer_growth": 18.42
    },
    "top_products": [
      {
        "product_id": "uuid",
        "name": "Smartphone XYZ",
        "units_sold": 25,
        "revenue": 14999.75
      }
    ],
    "top_sellers": [
      {
        "seller_id": "uuid", 
        "name": "Juan Pérez",
        "sales_count": 32,
        "total_revenue": 19199.68
      }
    ],
    "low_stock_alerts": 5,
    "expiring_warranties": 12        # Próximas 30 días
  }
}
```

---

### GET /stats/sales
Estadísticas detalladas de ventas con filtros avanzados.

**Acceso**: Requiere autenticación

**Query Parameters**:
```
?startDate=2024-01-01
&endDate=2024-12-31
&groupBy=day                    # day, week, month, year
&sellerId=uuid                  # Filtro por vendedor
&productId=uuid                 # Filtro por producto
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_sales": 500,
      "total_revenue": 299999.50,
      "average_sale": 599.99,
      "period_days": 365
    },
    "timeline": [
      {
        "period": "2024-01",
        "sales_count": 42,
        "revenue": 25199.58,
        "average_sale": 599.99
      }
    ],
    "by_product": [
      {
        "product_id": "uuid",
        "name": "Smartphone XYZ",
        "sales_count": 125,
        "revenue": 74999.75,
        "percentage": 25.0
      }
    ],
    "by_seller": [
      {
        "seller_id": "uuid",
        "name": "Juan Pérez", 
        "sales_count": 85,
        "revenue": 50999.15,
        "percentage": 17.0
      }
    ]
  }
}
```

## 🛡️ Garantías

### GET /warranties/expiring
Lista garantías que vencen próximamente.

**Acceso**: Requiere autenticación

**Query Parameters**:
```
?days=30                       # Días hacia adelante (default: 30)
&page=1
&limit=10
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "sale_id": "uuid",
      "product_name": "Smartphone XYZ",
      "customer_name": "María González",
      "customer_email": "maria@ejemplo.com",
      "customer_phone": "+1234567890",
      "warranty_end": "2024-02-15",
      "days_remaining": 15,
      "seller_name": "Juan Pérez"
    }
  ],
  "pagination": { }
}
```

---

### GET /warranties/statistics
Estadísticas generales de garantías.

**Acceso**: Requiere autenticación

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "total_warranties": 1250,
    "active_warranties": 892,
    "expired_warranties": 358,
    "expiring_soon": 45,           # Próximos 30 días
    "by_period": {
      "12_months": 750,
      "24_months": 400,
      "36_months": 100
    },
    "average_claim_rate": 0.08     # 8% de las garantías tienen reclamos
  }
}
```

---

### GET /warranties/check/:saleId
Verifica el estado de garantía de una venta específica.

**Acceso**: Requiere autenticación

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "sale_id": "uuid",
    "warranty_start": "2024-01-15",
    "warranty_end": "2025-01-15", 
    "warranty_period_months": 12,
    "is_active": true,
    "days_remaining": 275,
    "percentage_used": 24.66,
    "product": {
      "name": "Smartphone XYZ",
      "sku": "PHONE-XYZ-001"
    },
    "customer": {
      "name": "María González",
      "email": "maria@ejemplo.com"
    }
  }
}
```

## 📋 Reportes

### GET /reports/inventory
Reporte completo de inventario.

**Acceso**: Requiere autenticación + rol admin

**Query Parameters**:
```
?includeInactive=false         # Incluir productos inactivos
&lowStockOnly=false            # Solo productos con stock bajo
&format=json                   # json, csv (futuro)
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_products": 245,
      "active_products": 238,
      "low_stock_products": 15,
      "out_of_stock_products": 3,
      "total_inventory_value": 1250000.75,
      "average_stock_level": 45.2
    },
    "products": [
      {
        "id": "uuid",
        "name": "Smartphone XYZ",
        "sku": "PHONE-XYZ-001", 
        "current_stock": 45,
        "price": 599.99,
        "inventory_value": 26999.55,
        "is_active": true,
        "last_sale_date": "2024-01-14T16:20:00Z",
        "total_sales": 125,
        "status": "normal"            # normal, low, out
      }
    ],
    "categories": [
      {
        "category": "Smartphones",
        "product_count": 85,
        "total_value": 750000.25
      }
    ]
  }
}
```

---

### GET /reports/sales
Reporte detallado de ventas.

**Acceso**: Requiere autenticación

**Query Parameters**:
```
?startDate=2024-01-01
&endDate=2024-12-31
&groupBy=month                 # day, week, month, quarter, year
&sellerId=uuid                 # Filtro por vendedor
&includeImages=false           # Incluir URLs de imágenes
&format=json                   # json, csv (futuro)
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_sales": 1250,
      "total_revenue": 749999.25,
      "average_sale": 599.99,
      "period_start": "2024-01-01",
      "period_end": "2024-12-31",
      "unique_customers": 485,
      "repeat_customers": 145
    },
    "sales": [
      {
        "id": "uuid",
        "sale_date": "2024-01-15T10:30:00Z",
        "product_name": "Smartphone XYZ",
        "sku": "PHONE-XYZ-001",
        "customer_name": "María González",
        "seller_name": "Juan Pérez",
        "quantity": 1,
        "unit_price": 599.99,
        "total_price": 599.99,
        "warranty_months": 12,
        "serial_number": "SN123456789"
      }
    ],
    "trends": [
      {
        "period": "2024-01",
        "sales_count": 125,
        "revenue": 74999.75,
        "avg_sale": 599.99
      }
    ]
  }
}
```

## ⚠️ Códigos de Error

### Errores de Autenticación (401)
```json
{
  "success": false,
  "error": {
    "message": "Token no proporcionado"
  }
}

{
  "success": false,
  "error": {
    "message": "Token inválido o expirado"
  }
}
```

### Errores de Autorización (403)
```json
{
  "success": false,
  "error": {
    "message": "No tienes permisos para realizar esta acción"
  }
}
```

### Errores de Validación (400)
```json
{
  "success": false,
  "error": {
    "message": "Errores de validación",
    "details": [
      {
        "field": "email",
        "message": "Email no válido"
      },
      {
        "field": "password", 
        "message": "La contraseña debe tener al menos 6 caracteres"
      }
    ]
  }
}
```

### Errores de Recurso No Encontrado (404)
```json
{
  "success": false,
  "error": {
    "message": "Producto no encontrado"
  }
}
```

### Errores de Conflicto (409)
```json
{
  "success": false,
  "error": {
    "message": "El email ya está registrado"
  }
}

{
  "success": false,
  "error": {
    "message": "Stock insuficiente. Disponible: 5, Solicitado: 10"
  }
}
```

### Errores del Servidor (500)
```json
{
  "success": false,
  "error": {
    "message": "Error interno del servidor"
  }
}
```

## 🚀 Rate Limiting

Todas las rutas tienen límites de peticiones para prevenir abuso:

- **Autenticación**: 5 intentos por minuto por IP
- **General**: 100 peticiones por minuto por usuario autenticado
- **Subida de archivos**: 10 subidas por minuto por usuario

## 📝 Notas de Implementación

### Paginación
- Todas las listas usan paginación
- Límite máximo: 100 items por página
- Default: 10 items por página

### Fechas
- Todas las fechas están en formato ISO 8601 UTC
- Los filtros de fecha aceptan formato YYYY-MM-DD

### Archivos
- Imágenes se almacenan simuladamente en Cloudinary
- URLs generadas siguen el patrón de Cloudinary
- Validación de tipo MIME en el servidor

### Búsquedas
- Las búsquedas de texto son case-insensitive
- Usan ILIKE en PostgreSQL para coincidencias parciales
- Soportan búsqueda en múltiples campos

---

*Esta documentación se actualiza automáticamente con cada nuevo endpoint o cambio en la API.*