#!/bin/bash
# ============================================================
#  LifeLink Medical - Script de Instalación
#  Ejecutar: bash setup.sh
# ============================================================

set -e
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     LifeLink Medical - Setup          ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# === 1. Verificar requisitos ===
echo -e "${YELLOW}[1/6] Verificando requisitos...${NC}"

command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 no encontrado. Instálalo primero."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js no encontrado. Instálalo primero."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm no encontrado. Instálalo primero."; exit 1; }

PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
NODE_VERSION=$(node --version 2>&1 | grep -oP '\d+')

echo "  ✅ Python $(python3 --version 2>&1 | grep -oP '\d+\.\d+\.\d+')"
echo "  ✅ Node.js $(node --version)"
echo "  ✅ npm $(npm --version)"

# === 2. Backend - Entorno virtual ===
echo -e "\n${YELLOW}[2/6] Configurando backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "  ✅ Entorno virtual creado"
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
echo "  ✅ Dependencias de Python instaladas"

# === 3. Archivo .env ===
echo -e "\n${YELLOW}[3/6] Configurando variables de entorno...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    # Generar clave secreta aleatoria
    SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/tu_clave_secreta_cambiar_en_produccion_123456/$SECRET/" .env
    else
        sed -i "s/tu_clave_secreta_cambiar_en_produccion_123456/$SECRET/" .env
    fi
    echo "  ✅ Archivo .env creado con clave secreta generada"
    echo -e "  ${YELLOW}⚠️  Edita backend/.env para configurar tu base de datos PostgreSQL${NC}"
else
    echo "  ℹ️  Archivo .env ya existe"
fi

cd ..

# === 4. Frontend - Dependencias ===
echo -e "\n${YELLOW}[4/6] Configurando frontend...${NC}"
cd frontend
npm install --silent 2>/dev/null
echo "  ✅ Dependencias de Node.js instaladas"
cd ..

# === 5. Crear carpetas necesarias ===
echo -e "\n${YELLOW}[5/6] Creando directorios...${NC}"
mkdir -p backend/uploads/avatars backend/uploads/supplies
echo "  ✅ Carpetas de uploads creadas"

# === 6. Instrucciones finales ===
echo -e "\n${YELLOW}[6/6] ¡Instalación completa!${NC}"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅  LifeLink instalado correctamente             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 PASOS SIGUIENTES:${NC}"
echo ""
echo "  1. Configura PostgreSQL:"
echo "     - Crea la base de datos:"
echo "       psql -U postgres -c \"CREATE DATABASE lifelink_db;\""
echo ""
echo "  2. Edita backend/.env con tu contraseña de PostgreSQL:"
echo "     DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/lifelink_db"
echo ""
echo "  3. Inicializa la base de datos con datos de prueba:"
echo "     cd backend && source venv/bin/activate"
echo "     python -m init_db"
echo ""
echo "  4. Inicia el backend (Terminal 1):"
echo "     cd backend && source venv/bin/activate"
echo "     uvicorn app.main:app --reload --port 8000"
echo ""
echo "  5. Inicia el frontend (Terminal 2):"
echo "     cd frontend && npm run dev"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo "     Frontend:  http://localhost:5173"
echo "     API Docs:  http://localhost:8000/api/docs"
echo ""
echo -e "${BLUE}👤 Cuentas de prueba:${NC}"
echo "     Admin:       admin / admin123"
echo "     Donante:     donante1 / test123"
echo "     Solicitante: solicitante1 / test123"
echo ""
