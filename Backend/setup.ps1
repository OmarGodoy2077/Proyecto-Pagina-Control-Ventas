#!/usr/bin/env pwsh

# Script de configuración completa del backend
Write-Host "🚀 Configurando Sales Inventory & Warranty Management System Backend" -ForegroundColor Green
Write-Host ""

# Verificar si estamos en la carpeta correcta
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json no encontrado. Ejecuta este script desde la carpeta Backend" -ForegroundColor Red
    exit 1
}

# 1. Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

# 2. Verificar que .env existe
if (!(Test-Path ".env")) {
    Write-Host "⚠️ Archivo .env no encontrado, creando desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Archivo .env creado. Revisa y configura las variables de entorno." -ForegroundColor Green
}

# 3. Compilar TypeScript
Write-Host "🔨 Compilando TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando TypeScript" -ForegroundColor Red
    exit 1
}

# 4. Verificar PostgreSQL
Write-Host "🐘 Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL encontrado" -ForegroundColor Green
    
    # Intentar conectar y crear base de datos
    Write-Host "🔄 Creando base de datos sales_inventory_db..." -ForegroundColor Yellow
    createdb -U postgres sales_inventory_db 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de datos creada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Base de datos ya existe o error de conexión" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ PostgreSQL no encontrado. Por favor instala PostgreSQL:" -ForegroundColor Red
    Write-Host "   1. Descarga desde: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "   2. O ejecuta: .\install-postgresql.ps1" -ForegroundColor Cyan
    Write-Host "   3. Configura usuario: postgres, password: password" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Si PostgreSQL no está instalado, instálalo y crea la base de datos" -ForegroundColor White
Write-Host "   2. Revisa el archivo .env y ajusta las configuraciones" -ForegroundColor White
Write-Host "   3. Ejecuta: npm run dev (para desarrollo)" -ForegroundColor White
Write-Host "   4. O ejecuta: npm start (para producción)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 El servidor estará disponible en: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 Health check en: http://localhost:3000/api/health" -ForegroundColor Cyan