# Guía de Seguridad - Repositorio Git

## 🔒 Protección de Archivos Sensibles

### ✅ Archivos ya protegidos en .gitignore:
- `.env` (credenciales de base de datos, JWT secrets)
- `node_modules/` (dependencias)
- `dist/` (código compilado)
- `uploads/` (archivos subidos por usuarios)

### 🚨 IMPORTANTE: Antes de hacer tu primer commit

1. **Verifica que .env no esté siendo rastreado:**
   ```bash
   git status
   ```

2. **Si accidentalmente agregaste .env, quítalo:**
   ```bash
   git rm --cached .env
   ```

3. **Siempre haz commit del .env.example, NUNCA del .env:**
   ```bash
   git add .env.example
   git add .gitignore
   # ❌ NUNCA: git add .env
   ```

### 🔧 Comandos seguros para inicializar el repositorio:

```bash
# Inicializar Git
git init

# Verificar que .env está ignorado
git status

# Agregar archivos (excluyendo .env automáticamente)
git add .

# Primer commit
git commit -m "Initial commit - Backend setup"
```

### 🌍 Variables de entorno en diferentes ambientes:

- **Desarrollo local**: `.env` (ignorado por Git)
- **Producción**: Variables de entorno del servidor/hosting
- **CI/CD**: Variables secretas en GitHub Actions/GitLab CI
- **Equipo**: Cada desarrollador copia `.env.example` a `.env`

### ⚠️ Qué hacer si accidentalmente subiste .env:

1. **Cambiar TODAS las credenciales inmediatamente**
2. **Quitar el archivo del historial:**
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all
   ```
3. **Regenerar JWT secrets**
4. **Cambiar passwords de base de datos**