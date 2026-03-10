#!/bin/bash
# ============================================================
# PsiControl - Script de Instalación
# Centro Psicológico - Sistema de Gestión
# ============================================================

set -e

VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
AZUL='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${AZUL}[INFO]${NC} $1"; }
success() { echo -e "${VERDE}[OK]${NC} $1"; }
warn()    { echo -e "${AMARILLO}[AVISO]${NC} $1"; }
error()   { echo -e "${ROJO}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${AZUL}╔══════════════════════════════════════════╗${NC}"
echo -e "${AZUL}║   PsiControl - Instalación del Sistema   ║${NC}"
echo -e "${AZUL}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Detectar modo de instalación ──────────────────────────────
MODE=${1:-"local"}  # local | docker | prod

# ── Verificar dependencias ────────────────────────────────────
check_command() {
    if ! command -v "$1" &>/dev/null; then
        return 1
    fi
    return 0
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Modo Docker ───────────────────────────────────────────────
if [ "$MODE" = "docker" ] || [ "$MODE" = "prod" ]; then
    info "Modo: Docker / Producción"

    check_command docker || error "Docker no está instalado. Instálalo en https://docs.docker.com/get-docker/"
    check_command docker-compose || check_command "docker compose" || error "docker-compose no está instalado."

    # Generar SECRET_KEY segura
    if [ -f backend/.env ]; then
        CURRENT_KEY=$(grep SECRET_KEY backend/.env | cut -d= -f2)
        if [[ "$CURRENT_KEY" == *"cambia"* ]]; then
            warn "Generando SECRET_KEY segura..."
            NEW_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || \
                      openssl rand -hex 32 2>/dev/null || \
                      cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
            sed -i "s|SECRET_KEY=.*|SECRET_KEY=$NEW_KEY|" backend/.env
            success "SECRET_KEY generada"
        fi
    fi

    # Preguntar por dominio si es modo prod
    if [ "$MODE" = "prod" ]; then
        echo ""
        read -p "¿Cuál es la URL de tu servidor/dominio? (ej: https://micentro.com o http://IP): " DOMAIN
        DOMAIN=${DOMAIN:-"http://localhost"}

        # Actualizar CORS y API URL
        sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=${DOMAIN}:3000,${DOMAIN}|" backend/.env
        echo "NEXT_PUBLIC_API_URL=${DOMAIN}:8000" > frontend/.env.local
        echo "NEXT_PUBLIC_API_URL=${DOMAIN}:8000" >> .env 2>/dev/null || \
            echo "NEXT_PUBLIC_API_URL=${DOMAIN}:8000" > .env
        success "Configuración de dominio actualizada: $DOMAIN"
    fi

    info "Construyendo contenedores Docker..."
    if command -v docker-compose &>/dev/null; then
        docker-compose up -d --build
    else
        docker compose up -d --build
    fi

    echo ""
    success "¡Sistema instalado y ejecutándose!"
    echo ""
    echo -e "  🌐 Frontend:  ${VERDE}http://localhost:3000${NC}"
    echo -e "  🔌 Backend:   ${VERDE}http://localhost:8000${NC}"
    echo -e "  📖 API Docs:  ${VERDE}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "  👤 Admin:     ${AMARILLO}admin@centro.com${NC} / ${AMARILLO}admin123${NC}"
    echo -e "  👩‍⚕️ Terapeuta: ${AMARILLO}terapeuta@centro.com${NC} / ${AMARILLO}terapeuta123${NC}"
    echo ""
    warn "IMPORTANTE: Cambia las contraseñas después del primer inicio de sesión."
    exit 0
fi

# ── Modo Local (sin Docker) ───────────────────────────────────
info "Modo: Instalación local (sin Docker)"
echo ""

# Verificar Python
if check_command python3; then
    PYTHON=python3
elif check_command python; then
    PYTHON=python
else
    error "Python 3 no está instalado. Instálalo en https://python.org"
fi
PYTHON_VERSION=$($PYTHON --version 2>&1 | grep -E -o '[0-9]+\.[0-9]+')
info "Python detectado: $($PYTHON --version)"

# Verificar Node.js
check_command node || error "Node.js no está instalado. Instálalo en https://nodejs.org"
info "Node.js detectado: $(node --version)"
check_command npm || error "npm no está instalado."

# ── Instalar backend ──────────────────────────────────────────
echo ""
info "Instalando dependencias del backend..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    $PYTHON -m venv venv
    success "Entorno virtual creado"
fi

# Activar venv
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi

pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
success "Dependencias del backend instaladas"

# Crear directorio de datos
mkdir -p "$SCRIPT_DIR/data"

# ── Instalar frontend ─────────────────────────────────────────
echo ""
info "Instalando dependencias del frontend..."
cd "$SCRIPT_DIR/frontend"
npm install --silent
success "Dependencias del frontend instaladas"

# ── Crear scripts de inicio ───────────────────────────────────
cd "$SCRIPT_DIR"

cat > start-backend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi
echo "Iniciando backend en http://localhost:8000 ..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
EOF
chmod +x start-backend.sh

cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "Iniciando frontend en http://localhost:3000 ..."
npm run dev
EOF
chmod +x start-frontend.sh

cat > start.sh << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ""
echo "Iniciando PsiControl..."
echo ""

# Iniciar backend en background
bash "$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

# Iniciar frontend
bash "$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "Sistema corriendo:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener todo."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
EOF
chmod +x start.sh

# ── Resumen ───────────────────────────────────────────────────
echo ""
success "¡Instalación completada!"
echo ""
echo -e "  Para iniciar el sistema:"
echo -e "    ${VERDE}./start.sh${NC}                  (inicia todo)"
echo -e "    ${VERDE}./start-backend.sh${NC}          (solo backend)"
echo -e "    ${VERDE}./start-frontend.sh${NC}         (solo frontend)"
echo ""
echo -e "  URLs:"
echo -e "    🌐 Frontend:  ${VERDE}http://localhost:3000${NC}"
echo -e "    🔌 Backend:   ${VERDE}http://localhost:8000${NC}"
echo -e "    📖 API Docs:  ${VERDE}http://localhost:8000/docs${NC}"
echo ""
echo -e "  Credenciales iniciales:"
echo -e "    👤 Admin:     ${AMARILLO}admin@centro.com${NC} / ${AMARILLO}admin123${NC}"
echo -e "    👩‍⚕️ Terapeuta: ${AMARILLO}terapeuta@centro.com${NC} / ${AMARILLO}terapeuta123${NC}"
echo ""
warn "IMPORTANTE: Cambia las contraseñas después del primer inicio de sesión."
