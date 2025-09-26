# Documentación de Despliegue

## 🚀 Guía Completa de Despliegue

### Entornos Soportados

- **Desarrollo Local**: Node.js + PostgreSQL local
- **Producción**: Heroku, DigitalOcean, AWS, Azure, etc.
- **Docker**: Contenedores con Docker Compose

## 🛠️ Despliegue Local (Desarrollo)

### Prerrequisitos
```bash
# Node.js 18 o superior
node --version

# PostgreSQL 12 o superior
psql --version

# Git
git --version
```

### Configuración Paso a Paso

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd sales-inventory-warranty-system
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar PostgreSQL**
   ```sql
   -- Conectar como superusuario
   psql -U postgres

   -- Crear base de datos y usuario
   CREATE DATABASE sales_inventory_db;
   CREATE USER sales_user WITH PASSWORD 'tu_password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE sales_inventory_db TO sales_user;

   -- Otorgar permisos adicionales
   \c sales_inventory_db
   GRANT ALL ON SCHEMA public TO sales_user;
   GRANT CREATE ON SCHEMA public TO sales_user;
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```

   Editar `.env`:
   ```env
   # Base de datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sales_inventory_db
   DB_USER=sales_user
   DB_PASSWORD=tu_password_seguro

   # JWT
   JWT_ACCESS_SECRET=tu_clave_secreta_access_muy_larga_y_segura
   JWT_REFRESH_SECRET=tu_clave_secreta_refresh_muy_larga_y_segura

   # Servidor
   PORT=3000
   NODE_ENV=development

   # Cloudinary (simulado)
   CLOUDINARY_CLOUD_NAME=demo
   CLOUDINARY_API_KEY=demo_key
   CLOUDINARY_API_SECRET=demo_secret
   ```

5. **Iniciar la aplicación**
   ```bash
   npm run dev
   ```

   La aplicación:
   - Creará automáticamente todas las tablas
   - Configurará índices y triggers
   - Iniciará el servidor en http://localhost:3000

### Verificación de Instalación

```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/health

# Debería retornar:
# {"success": true, "message": "Servidor funcionando correctamente"}
```

## 🐳 Despliegue con Docker

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=sales_inventory_db
      - DB_USER=sales_user
      - DB_PASSWORD=secure_password
      - JWT_ACCESS_SECRET=your_access_secret_key
      - JWT_REFRESH_SECRET=your_refresh_secret_key
    depends_on:
      - postgres
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sales_inventory_db
      - POSTGRES_USER=sales_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Comandos Docker
```bash
# Construir y ejecutar
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener servicios
docker-compose down

# Limpiar volúmenes (¡CUIDADO! Borra datos)
docker-compose down -v
```

## ☁️ Despliegue en Heroku

### Configuración de Heroku

1. **Instalar Heroku CLI**
   ```bash
   # Windows
   choco install heroku-cli

   # macOS
   brew install heroku/brew/heroku

   # Linux
   sudo snap install --classic heroku
   ```

2. **Crear aplicación**
   ```bash
   heroku create tu-app-name
   ```

3. **Configurar PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Configurar variables de entorno**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_ACCESS_SECRET=tu_clave_secreta_access
   heroku config:set JWT_REFRESH_SECRET=tu_clave_secreta_refresh
   heroku config:set CLOUDINARY_CLOUD_NAME=tu_cloudinary_name
   heroku config:set CLOUDINARY_API_KEY=tu_api_key
   heroku config:set CLOUDINARY_API_SECRET=tu_api_secret
   ```

5. **Configurar Procfile**
   ```
   web: npm start
   release: npm run build
   ```

6. **Desplegar**
   ```bash
   git push heroku main
   ```

### Script de Build para Heroku
En `package.json`:
```json
{
  "scripts": {
    "heroku-prebuild": "echo Preparando build...",
    "heroku-postbuild": "npm run build"
  }
}
```

## 🌊 Despliegue en DigitalOcean

### Usando App Platform

1. **Crear archivo de configuración** (`.do/app.yaml`):
   ```yaml
   name: sales-inventory-system
   services:
   - name: api
     source_dir: /
     github:
       repo: tu-usuario/tu-repositorio
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: JWT_ACCESS_SECRET
       value: ${JWT_ACCESS_SECRET}
     - key: JWT_REFRESH_SECRET  
       value: ${JWT_REFRESH_SECRET}
   databases:
   - name: postgres-db
     engine: PG
     version: "15"
     size_slug: db-s-1vcpu-1gb
   ```

2. **Crear base de datos**
   ```bash
   doctl databases create postgres-sales --engine postgres --version 15 --size db-s-1vcpu-1gb
   ```

### Usando Droplet (VPS)

1. **Crear Droplet Ubuntu 22.04**
2. **Conectar por SSH**
   ```bash
   ssh root@tu_droplet_ip
   ```

3. **Instalar Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   ```

4. **Instalar PostgreSQL**
   ```bash
   apt update
   apt install postgresql postgresql-contrib -y
   
   # Configurar PostgreSQL
   sudo -u postgres psql
   CREATE DATABASE sales_inventory_db;
   CREATE USER sales_user WITH PASSWORD 'password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE sales_inventory_db TO sales_user;
   ```

5. **Configurar aplicación**
   ```bash
   git clone <repository-url>
   cd sales-inventory-warranty-system
   npm install
   npm run build
   ```

6. **Configurar PM2**
   ```bash
   npm install -g pm2
   
   # Crear archivo ecosystem
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'sales-api',
       script: 'dist/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   EOF
   
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

7. **Configurar Nginx**
   ```bash
   apt install nginx -y
   
   cat > /etc/nginx/sites-available/sales-api << EOF
   server {
     listen 80;
     server_name tu_dominio.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade \$http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host \$host;
       proxy_set_header X-Real-IP \$remote_addr;
       proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto \$scheme;
       proxy_cache_bypass \$http_upgrade;
     }
   }
   EOF
   
   ln -s /etc/nginx/sites-available/sales-api /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

## 🔒 SSL/TLS con Let's Encrypt

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
certbot --nginx -d tu_dominio.com

# Renovación automática
crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoreo y Logs

### Configuración de Logs

1. **Winston para logs estructurados**
   ```bash
   npm install winston winston-daily-rotate-file
   ```

2. **Configuración de logging** (`src/utils/logger.ts`):
   ```typescript
   import winston from 'winston';
   import DailyRotateFile from 'winston-daily-rotate-file';

   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     transports: [
       new DailyRotateFile({
         filename: 'logs/error-%DATE%.log',
         datePattern: 'YYYY-MM-DD',
         level: 'error',
         maxFiles: '30d'
       }),
       new DailyRotateFile({
         filename: 'logs/combined-%DATE%.log',
         datePattern: 'YYYY-MM-DD',
         maxFiles: '30d'
       })
     ]
   });

   if (process.env.NODE_ENV !== 'production') {
     logger.add(new winston.transports.Console({
       format: winston.format.simple()
     }));
   }

   export default logger;
   ```

### Health Check Endpoint
```typescript
// En src/routes/health.ts
router.get('/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  });
});
```

### Monitoreo con PM2

```bash
# Ver status
pm2 status

# Ver logs en tiempo real  
pm2 logs sales-api

# Monitoreo web
pm2 web

# Reiniciar aplicación
pm2 restart sales-api

# Reload sin downtime
pm2 reload sales-api
```

## 🔧 Variables de Entorno por Ambiente

### Desarrollo (.env.development)
```env
NODE_ENV=development
LOG_LEVEL=debug
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sales_inventory_dev
DB_USER=dev_user
DB_PASSWORD=dev_password
JWT_ACCESS_SECRET=dev_access_secret
JWT_REFRESH_SECRET=dev_refresh_secret
CLOUDINARY_CLOUD_NAME=demo
```

### Testing (.env.test)
```env
NODE_ENV=test
LOG_LEVEL=error
DB_HOST=localhost
DB_PORT=5433
DB_NAME=sales_inventory_test
DB_USER=test_user
DB_PASSWORD=test_password
JWT_ACCESS_SECRET=test_access_secret
JWT_REFRESH_SECRET=test_refresh_secret
```

### Producción (.env.production)
```env
NODE_ENV=production
LOG_LEVEL=warn
DB_HOST=production_db_host
DB_PORT=5432
DB_NAME=sales_inventory_prod
DB_USER=prod_user
DB_PASSWORD=super_secure_password
JWT_ACCESS_SECRET=very_long_secure_access_secret
JWT_REFRESH_SECRET=very_long_secure_refresh_secret
CLOUDINARY_CLOUD_NAME=production_cloud
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret
```

## 🚨 Troubleshooting

### Errores Comunes

1. **Puerto ya en uso**
   ```bash
   # Encontrar proceso usando puerto 3000
   lsof -i :3000
   
   # Matar proceso
   kill -9 PID
   ```

2. **Error de conexión a PostgreSQL**
   ```bash
   # Verificar que PostgreSQL esté corriendo
   sudo systemctl status postgresql
   
   # Reiniciar PostgreSQL
   sudo systemctl restart postgresql
   
   # Verificar logs de PostgreSQL
   sudo tail -f /var/log/postgresql/postgresql-15-main.log
   ```

3. **Memoria insuficiente**
   ```bash
   # Agregar swap en Linux
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **Certificados SSL expirados**
   ```bash
   # Renovar certificados
   certbot renew --dry-run
   certbot renew
   ```

### Logs de Debugging

```bash
# Ver logs de aplicación
tail -f logs/combined-$(date +%Y-%m-%d).log

# Ver logs de error solamente
tail -f logs/error-$(date +%Y-%m-%d).log

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 📈 Optimización para Producción

### Configuraciones Recomendadas

1. **PM2 Cluster Mode**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'sales-api',
       script: 'dist/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production'
       }
     }]
   }
   ```

2. **PostgreSQL Tuning**
   ```sql
   -- En postgresql.conf
   shared_buffers = 256MB
   effective_cache_size = 1GB
   maintenance_work_mem = 64MB
   checkpoint_completion_target = 0.9
   wal_buffers = 16MB
   default_statistics_target = 100
   random_page_cost = 1.1
   ```

3. **Nginx Optimization**
   ```nginx
   # En /etc/nginx/nginx.conf
   worker_processes auto;
   worker_connections 1024;
   
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_types text/plain application/json application/javascript text/css;
   
   # Rate limiting
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   
   server {
     location /api/ {
       limit_req zone=api burst=20 nodelay;
       proxy_pass http://localhost:3000;
     }
   }
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "tu-app-name"
        heroku_email: "tu-email@ejemplo.com"
```

---

Esta guía cubre todos los aspectos principales del despliegue. Para configuraciones específicas o entornos particulares, consulta la documentación oficial de cada plataforma.