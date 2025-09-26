# Sistema de Gestión de Ventas, Inventario y Garantías

Un sistema backend robusto, escalable y seguro desarrollado con Node.js, Express, TypeScript, PostgreSQL y JWT para la gestión completa de ventas, inventario y garantías.

## 🚀 Características Principales

### Autenticación y Seguridad
- ✅ Registro e inicio de sesión de vendedores (usuarios)
- ✅ Autenticación JWT con Access Token (15 min) + Refresh Token (7 días)
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Middleware de autenticación y autorización por roles
- ✅ Cookies HTTP-only para refresh tokens
- ✅ Validación estricta de datos de entrada

### Gestión de Productos
- ✅ CRUD completo de productos (nombre, descripción, SKU, stock, precio)
- ✅ Filtros avanzados y búsqueda
- ✅ Control de stock con alertas de stock bajo
- ✅ Ajuste manual de inventario con auditoría

### Gestión de Clientes
- ✅ CRUD completo de clientes (nombre, email, teléfono, dirección)
- ✅ Historial de compras por cliente
- ✅ Estadísticas de compras individuales

### Sistema de Ventas
- ✅ Registro de ventas con vinculación automática de producto, cliente y vendedor
- ✅ Cálculo automático de precios totales y fechas de garantía
- ✅ Subida de hasta 3 fotos por venta (sealed, full_product, serial_number)
- ✅ OCR simulado para extracción de números de serie
- ✅ Actualización automática de stock tras ventas

### Gestión de Garantías
- ✅ Cálculo automático de warranty_start y warranty_end
- ✅ Consulta de garantías próximas a vencer (próximos 30 días)
- ✅ Estadísticas completas de garantías
- ✅ Verificación de estado de garantías individuales

### Reportes y Estadísticas
- ✅ Dashboard con métricas clave
- ✅ Reportes de ventas con filtros avanzados
- ✅ Reportes de inventario
- ✅ Análisis de rendimiento por vendedor
- ✅ Estadísticas por períodos (semanal, mensual, trimestral, anual)

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js con TypeScript
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL con consultas SQL nativas
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcryptjs, helmet, cors
- **Validación**: express-validator
- **Subida de Archivos**: multer (simulado con Cloudinary URLs)
- **OCR**: Simulado (preparado para Tesseract.js o Google Vision)
- **Logging**: morgan
- **Variables de Entorno**: dotenv

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd sales-inventory-warranty-system
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar el archivo `.env` con tus configuraciones:
   ```env
   # Variables de base de datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sales_inventory_db
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   
   # Variables JWT
   JWT_ACCESS_SECRET=tu_clave_secreta_access
   JWT_REFRESH_SECRET=tu_clave_secreta_refresh
   
   # Configuración del servidor
   PORT=3000
   NODE_ENV=development
   ```

4. **Crear base de datos**
   ```sql
   CREATE DATABASE sales_inventory_db;
   ```

5. **Inicializar la aplicación**
   ```bash
   npm run dev
   ```
   
   La aplicación automáticamente:
   - Creará todas las tablas necesarias
   - Configurará índices y triggers
   - Iniciará el servidor en el puerto especificado

## 🚀 Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Producción (requiere build previo)
npm start

# Tests (cuando se implementen)
npm test
```

## 📚 Documentación de la API

### Endpoints Principales

#### Autenticación
```
POST   /api/auth/register      - Registrar nuevo usuario
POST   /api/auth/login         - Iniciar sesión
POST   /api/auth/refresh       - Renovar access token
POST   /api/auth/logout        - Cerrar sesión
GET    /api/auth/me            - Información del usuario actual
POST   /api/auth/change-password - Cambiar contraseña
```

#### Productos
```
GET    /api/products           - Listar productos (con filtros)
GET    /api/products/:id       - Obtener producto específico
POST   /api/products           - Crear producto (Admin)
PUT    /api/products/:id       - Actualizar producto (Admin)
DELETE /api/products/:id       - Desactivar producto (Admin)
GET    /api/products/low-stock - Productos con stock bajo
POST   /api/products/:id/adjust-stock - Ajustar stock (Admin)
```

#### Clientes
```
GET    /api/customers          - Listar clientes (con filtros)
GET    /api/customers/:id      - Obtener cliente específico
POST   /api/customers          - Crear cliente
PUT    /api/customers/:id      - Actualizar cliente
DELETE /api/customers/:id      - Eliminar cliente (Admin)
GET    /api/customers/:id/sales - Historial de ventas del cliente
GET    /api/customers/:id/statistics - Estadísticas del cliente
```

#### Ventas
```
GET    /api/sales              - Listar ventas (con filtros)
GET    /api/sales/:id          - Obtener venta específica
POST   /api/sales              - Registrar nueva venta
POST   /api/sales/:id/images   - Subir imágenes de venta
POST   /api/sales/:id/extract-serial - Extraer número de serie con OCR
```

#### Estadísticas y Reportes
```
GET    /api/stats/dashboard    - Estadísticas del dashboard
GET    /api/stats/sales        - Estadísticas detalladas de ventas
GET    /api/warranties/expiring - Garantías próximas a vencer
GET    /api/warranties/statistics - Estadísticas de garantías
GET    /api/warranties/check/:saleId - Verificar estado de garantía
GET    /api/reports/inventory  - Reporte de inventario (Admin)
GET    /api/reports/sales      - Reporte de ventas
```

### Ejemplos de Uso

#### Registrar Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendedor@ejemplo.com",
    "password": "contraseña123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "seller"
  }'
```

#### Crear Producto
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "name": "Smartphone XYZ",
    "description": "Smartphone de última generación",
    "sku": "PHONE-XYZ-001",
    "stock": 50,
    "price": 599.99
  }'
```

#### Registrar Venta
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "product_id": "uuid-del-producto",
    "customer_id": "uuid-del-cliente",
    "quantity": 2,
    "unit_price": 599.99,
    "warranty_period_months": 12
  }'
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema (vendedores y administradores)
- **products**: Catálogo de productos
- **customers**: Base de datos de clientes
- **sales**: Registro de todas las ventas
- **sale_images**: Imágenes asociadas a cada venta
- **refresh_tokens**: Tokens de refresh activos

### Características Técnicas

- **UUIDs**: Todos los IDs son UUID v4 para mayor seguridad
- **Triggers**: Actualización automática de `updated_at`
- **Índices**: Optimizados para consultas frecuentes
- **Constraints**: Validaciones a nivel de base de datos
- **Soft Delete**: Los productos se desactivan en lugar de eliminarse

## 🔧 Arquitectura del Proyecto

```
src/
├── config/          # Configuración y variables de entorno
├── controllers/     # Lógica de controladores
├── routes/          # Definición de rutas de la API
├── middleware/      # Autenticación, validación, manejo de errores
├── services/        # Lógica de negocio (OCR, garantías, imágenes)
├── models/          # Interfaces y tipos de TypeScript
├── utils/           # Funciones auxiliares (JWT, hashing, fechas)
├── database/        # Conexión y configuración de PostgreSQL
├── app.ts           # Configuración de la aplicación Express
└── server.ts        # Servidor principal
```

## 🔒 Seguridad Implementada

- **JWT con doble token**: Access token corto + Refresh token largo
- **Hashing de contraseñas**: bcrypt con 12 rounds
- **Validación estricta**: express-validator en todos los endpoints
- **CORS configurado**: Solo orígenes permitidos
- **Headers de seguridad**: helmet.js
- **Rate limiting**: Preparado para implementar
- **SQL Injection**: Uso de consultas parametrizadas
- **XSS Protection**: Sanitización de inputs

## 📈 Características de Escalabilidad

- **Pool de conexiones**: Gestión eficiente de conexiones a PostgreSQL
- **Índices optimizados**: Para consultas frecuentes
- **Paginación**: En todos los listados
- **Soft delete**: Preserva integridad referencial
- **Logging estructurado**: Para monitoreo en producción
- **Graceful shutdown**: Cierre ordenado del servidor
- **Environment-aware**: Configuración por ambiente

## 🔮 Funcionalidades Futuras

### Integraciones Planeadas
- **OCR Real**: Tesseract.js o Google Vision API
- **Almacenamiento**: Cloudinary para imágenes reales
- **Notificaciones**: Email/SMS para garantías próximas a vencer
- **Exportación**: PDF/Excel para reportes
- **Análitica**: Dashboard más avanzado con gráficos

### Mejoras Técnicas
- **Tests**: Suites completas de pruebas unitarias e integración
- **Rate Limiting**: Implementación de límites de peticiones
- **Caching**: Redis para optimización de consultas
- **Websockets**: Actualizaciones en tiempo real
- **Microservicios**: Separación por dominios

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión a PostgreSQL**
   - Verificar que PostgreSQL esté corriendo
   - Revisar credenciales en `.env`
   - Confirmar que la base de datos exista

2. **Errores de compilación TypeScript**
   - Ejecutar `npm run build` para ver errores detallados
   - Verificar versión de Node.js (>= 18)

3. **Tokens JWT inválidos**
   - Verificar que las claves secretas estén configuradas
   - Los tokens expiran según configuración

4. **Errores de validación**
   - Revisar formato de datos enviados
   - Consultar documentación de endpoints

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para la nueva característica (`git checkout -b feature/nueva-caracteristica`)
3. Commit los cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Omar Godoy** - Desarrollador Full-Stack

---

## 📞 Soporte

Para soporte técnico o consultas sobre implementación:
- Crear un issue en el repositorio
- Enviar email a: [tu-email@ejemplo.com]

---

*Desarrollado con ❤️ usando TypeScript, Express.js y PostgreSQL*