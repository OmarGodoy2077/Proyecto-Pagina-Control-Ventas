# Script para instalar PostgreSQL en Windows usando Chocolatey
# Si no tienes Chocolatey instalado, ejecuta primero esto en PowerShell como administrador:
# Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar PostgreSQL
choco install postgresql --params '/Password:password' -y

# O si prefieres descarga directa (alternativa):
# Descargar desde: https://www.postgresql.org/download/windows/
# Instalar con usuario: postgres, password: password

# Después de la instalación:
# 1. Agregar PostgreSQL al PATH (usualmente: C:\Program Files\PostgreSQL\15\bin)
# 2. Reiniciar PowerShell
# 3. Crear base de datos con los comandos abajo

Write-Host "Después de instalar PostgreSQL, ejecuta estos comandos:"
Write-Host "createdb -U postgres sales_inventory_db"
Write-Host "o conecta con: psql -U postgres"