# LifeLink Medical 🏥

Plataforma web responsive de intercambio de insumos médicos. Permite donar, vender e intercambiar equipos médicos como sillas de ruedas, muletas, oxímetros, prótesis y más. Incluye sistema de donación de sangre.

## 🚀 Tecnologías

**Backend:** Python 3.10+ · FastAPI · SQLAlchemy · PostgreSQL · JWT Auth  
**Frontend:** React 18 · Vite · Tailwind CSS · Axios · React Router  
**Diseño:** Web responsive (móvil + escritorio en un solo código)

## 📁 Estructura del Proyecto

```
lifelink/
├── backend/
│   ├── app/
│   │   ├── main.py            # Entrada FastAPI + CORS + routers
│   │   ├── config.py          # Variables de entorno con Pydantic
│   │   ├── database.py        # Conexión SQLAlchemy + PostgreSQL
│   │   ├── models/            # Modelos de base de datos
│   │   │   ├── user.py        # Usuarios, roles, donantes sangre
│   │   │   ├── supply.py      # Insumos, imágenes, categorías, favoritos
│   │   │   ├── request.py     # Solicitudes de contacto
│   │   │   ├── notification.py# Notificaciones
│   │   │   ├── message.py     # Mensajes (chat)
│   │   │   └── review.py      # Reseñas/calificaciones
│   │   ├── schemas/           # Validación Pydantic (entrada/salida)
│   │   ├── routers/           # Endpoints de la API
│   │   │   ├── auth.py        # Login, registro
│   │   │   ├── users.py       # Perfil, avatar, donantes sangre
│   │   │   ├── supplies.py    # CRUD insumos, búsqueda, favoritos
│   │   │   ├── requests.py    # Solicitudes contacto
│   │   │   ├── notifications.py # Notificaciones
│   │   │   ├── messages.py    # Chat entre usuarios
│   │   │   └── admin.py       # Dashboard, gestión usuarios
│   │   └── utils/
│   │       ├── security.py    # JWT, hashing contraseñas
│   │       └── dependencies.py# Middleware autenticación
│   ├── requirements.txt
│   ├── .env.example
│   └── init_db.py             # Seed data de prueba
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Layout, SupplyCard, ProtectedRoute
│   │   ├── pages/             # 12 páginas completas
│   │   ├── services/api.js    # Cliente Axios con interceptors
│   │   ├── context/           # AuthContext (estado global)
│   │   └── App.jsx            # Rutas de la aplicación
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js         # Proxy API configurado
├── setup.sh                   # Instalación automática
└── README.md
```

## ⚡ Instalación Rápida

### Requisitos previos
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Paso 1: Clonar/Descargar y ejecutar setup
```bash
cd lifelink
chmod +x setup.sh
bash setup.sh
```

### Paso 2: Crear la base de datos
```bash
psql -U postgres -c "CREATE DATABASE lifelink_db;"
```

### Paso 3: Editar configuración
Edita `backend/.env` con tu contraseña de PostgreSQL:
```
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/lifelink_db
```

### Paso 4: Inicializar datos de prueba
```bash
cd backend
source venv/bin/activate      # Windows: venv\Scripts\activate
python -m init_db
```

### Paso 5: Iniciar el backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Paso 6: Iniciar el frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

### 🌐 Acceder
- **App:** http://localhost:5173
- **API Docs:** http://localhost:8000/api/docs

### 👤 Cuentas de prueba
| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | admin | admin123 |
| Donante | donante1 | test123 |
| Solicitante | solicitante1 | test123 |

## 🔧 Funcionalidades

### Originales (del documento de requerimientos)
1. **Autenticación** — Login/Registro con JWT y roles (solicitante, donante, admin)
2. **Gestión de Perfil** — Editar datos, foto, ubicación
3. **Buscar Insumos/Donantes** — Búsqueda con filtros por categoría, tipo, ciudad, precio
4. **Solicitud de Contacto** — Enviar solicitudes con verificación de disponibilidad
5. **Publicar Insumo** — Crear publicaciones con imágenes, marcar como urgente
6. **Responder Solicitudes** — Aceptar/rechazar con notificaciones automáticas

### Nuevas (optimizaciones agregadas)
7. **Sistema de Mensajes** — Chat entre usuarios con solicitudes aceptadas
8. **Notificaciones** — Centro de notificaciones con contador en tiempo real
9. **Favoritos** — Guardar insumos de interés
10. **Panel Admin** — Dashboard con estadísticas y gestión de usuarios
11. **Donación de Sangre** — Registro como donante con tipo de sangre y búsqueda
12. **Sistema de Reseñas** — Calificación entre usuarios después de transacciones
13. **Subida de Imágenes** — Múltiples fotos por insumo con galería
14. **Paginación** — Resultados paginados con orden configurable
15. **Diseño Responsive** — Navegación inferior móvil, menú hamburguesa, adaptación completa
16. **Categorías Médicas** — 8 categorías especializadas con iconos
17. **Marcador de Urgencia** — Publicaciones urgentes con prioridad visual

## 📱 Responsive Design

La aplicación se adapta automáticamente a cualquier dispositivo:
- **Móvil:** Navegación inferior, menú hamburguesa, cards apilados
- **Tablet:** Grid de 2 columnas, sidebar adaptable
- **Desktop:** Grid completo, dropdown de perfil, sidebar fijo

## 🔌 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login |
| GET | /api/users/me | Mi perfil |
| PUT | /api/users/me | Editar perfil |
| POST | /api/users/me/avatar | Subir foto |
| GET | /api/users/donors/blood | Buscar donantes sangre |
| GET | /api/supplies/ | Listar/buscar insumos |
| POST | /api/supplies/ | Crear insumo |
| GET | /api/supplies/{id} | Detalle insumo |
| PUT | /api/supplies/{id} | Editar insumo |
| DELETE | /api/supplies/{id} | Eliminar insumo |
| POST | /api/supplies/{id}/images | Subir imágenes |
| POST | /api/supplies/{id}/favorite | Toggle favorito |
| POST | /api/requests/ | Enviar solicitud |
| GET | /api/requests/sent | Solicitudes enviadas |
| GET | /api/requests/received | Solicitudes recibidas |
| PUT | /api/requests/{id}/respond | Responder solicitud |
| GET | /api/notifications/ | Mis notificaciones |
| PUT | /api/notifications/read-all | Marcar todas leídas |
| GET | /api/messages/ | Mis conversaciones |
| GET | /api/messages/{id} | Chat de conversación |
| POST | /api/messages/ | Enviar mensaje |
| GET | /api/admin/dashboard | Stats admin |
| GET | /api/admin/users | Listar usuarios |

---
**LifeLink Medical** — Conectamos vidas a través de insumos médicos 🏥
