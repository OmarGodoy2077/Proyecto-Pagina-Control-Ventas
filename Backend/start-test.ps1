#!/usr/bin/env pwsh

# Script de inicio rápido para pruebas (con SQLite en lugar de PostgreSQL)
Write-Host "🚀 Iniciando Backend en modo de pruebas..." -ForegroundColor Green

# Verificar dependencias instaladas
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Crear directorio de uploads si no existe
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force
    Write-Host "📁 Directorio uploads creado" -ForegroundColor Green
}

# Iniciar en modo desarrollo
Write-Host "🔄 Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host "⚠️ Nota: Asegúrate de tener PostgreSQL corriendo y configurado" -ForegroundColor Yellow
Write-Host ""

npm run dev