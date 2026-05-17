# LifeLink — Documentación Técnica del Proyecto
### Plataforma de Intercambio de Insumos Médicos

---

## 1. DESCRIPCIÓN GENERAL DEL PROYECTO

**LifeLink** es una plataforma web solidaria que conecta a personas con insumos médicos. Permite que quienes tienen equipos médicos que ya no necesitan (sillas de ruedas, muletas, camas hospitalarias, etc.) los donen, vendan o intercambien con personas que sí los necesitan, sin intermediarios.

### Problema que resuelve
En México, miles de familias no pueden costear equipos médicos esenciales. Al mismo tiempo, muchos hogares tienen equipos guardados sin uso. LifeLink conecta ambas partes de forma gratuita y segura.

### Funcionalidades principales
- Publicar insumos médicos (donación, venta o intercambio)
- Buscar insumos por categoría, ciudad y tipo
- Solicitar contacto con el dueño del insumo
- Chat privado entre usuarios
- Sistema de notificaciones en tiempo real
- Reseñas y calificaciones entre usuarios
- Búsqueda de donantes de sangre
- Panel de administración
- Subida de imágenes permanente en la nube

---

## 2. ARQUITECTURA DEL SISTEMA

El proyecto sigue una arquitectura **cliente-servidor** separada en dos aplicaciones independientes:

```
┌─────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
        ┌──────────────▼──────────────┐
        │   FRONTEND (Vercel)          │
        │   React + Vite + Tailwind    │
        │   life-link-web-sigma.vercel │
        └──────────────┬──────────────┘
                       │ REST API / JSON
        ┌──────────────▼──────────────┐
        │   BACKEND (Railway)          │
        │   FastAPI + Python           │
        │   lifelinkweb.up.railway.app │
        └──────┬───────────┬──────────┘
               │           │
   ┌───────────▼──┐   ┌────▼──────────┐
   │  PostgreSQL   │   │  Cloudinary   │
   │  (Neon)       │   │  (Imágenes)   │
   │  Base de datos│   │  Cloud        │
   └──────────────┘   └───────────────┘
```

### Patrón arquitectónico
- **Backend:** API REST (Representational State Transfer)
- **Frontend:** SPA (Single Page Application)
- **Comunicación:** JSON sobre HTTPS
- **Autenticación:** JWT (JSON Web Tokens)

---

## 3. TECNOLOGÍAS Y LENGUAJES UTILIZADOS

### BACKEND

| Tecnología | Versión | Para qué se usa |
|-----------|---------|-----------------|
| **Python** | 3.11.9 | Lenguaje principal del backend |
| **FastAPI** | 0.115.0 | Framework web para crear la API REST |
| **SQLAlchemy** | 2.0.35 | ORM para manejar la base de datos |
| **PostgreSQL** | — | Base de datos relacional |
| **Alembic** | 1.13.2 | Migraciones de base de datos |
| **Pydantic** | 2.9.0 | Validación de datos y esquemas |
| **python-jose** | 3.3.0 | Generación y verificación de tokens JWT |
| **bcrypt** | 5.0.0 | Hash seguro de contraseñas |
| **Cloudinary** | 1.41.0 | Almacenamiento de imágenes en la nube |
| **Uvicorn** | 0.30.0 | Servidor ASGI para correr FastAPI |
| **psycopg2** | 2.9.9 | Driver para conectar Python con PostgreSQL |
| **python-dotenv** | 1.0.1 | Variables de entorno |
| **Pillow** | 10.4.0 | Procesamiento de imágenes |
| **aiofiles** | 24.1.0 | Manejo asíncrono de archivos |

### FRONTEND

| Tecnología | Versión | Para qué se usa |
|-----------|---------|-----------------|
| **JavaScript (ES2022)** | — | Lenguaje principal del frontend |
| **React** | 18.3.1 | Biblioteca para construir la interfaz de usuario |
| **Vite** | 5.4.2 | Herramienta de construcción y desarrollo |
| **Tailwind CSS** | 3.4.10 | Framework de estilos CSS utilitarios |
| **React Router DOM** | 6.26.0 | Enrutamiento de páginas en el navegador |
| **Axios** | 1.7.4 | Cliente HTTP para llamadas a la API |
| **React Hot Toast** | 2.4.1 | Notificaciones visuales (toasts) |
| **Lucide React** | 0.441.0 | Biblioteca de iconos SVG |
| **React Leaflet** | 4.2.1 | Mapas interactivos |

### INFRAESTRUCTURA (DESPLIEGUE)

| Servicio | Para qué se usa | Plan |
|---------|----------------|------|
| **Railway** | Hospedar el backend (FastAPI) | Gratuito |
| **Vercel** | Hospedar el frontend (React) | Gratuito |
| **Neon** | Base de datos PostgreSQL en la nube | Gratuito |
| **Cloudinary** | Almacenar imágenes de insumos y avatares | Gratuito |
| **GitHub** | Control de versiones y repositorio del código | Gratuito |

---

## 4. ESTRUCTURA DEL PROYECTO

```
LifeLink/
├── backend/                    ← API REST en Python
│   ├── app/
│   │   ├── main.py             ← Punto de entrada, configura FastAPI y CORS
│   │   ├── config.py           ← Variables de entorno y configuración
│   │   ├── database.py         ← Conexión a PostgreSQL con SQLAlchemy
│   │   ├── models/             ← Definición de tablas de la base de datos
│   │   │   ├── user.py         ← Modelo de Usuario
│   │   │   ├── supply.py       ← Modelo de Insumo médico
│   │   │   ├── request.py      ← Modelo de Solicitud de contacto
│   │   │   ├── message.py      ← Modelo de Mensaje
│   │   │   ├── notification.py ← Modelo de Notificación
│   │   │   └── review.py       ← Modelo de Reseña
│   │   ├── routers/            ← Endpoints de la API (rutas)
│   │   │   ├── auth.py         ← Login y registro
│   │   │   ├── users.py        ← Perfil y avatar
│   │   │   ├── supplies.py     ← CRUD de insumos
│   │   │   ├── requests.py     ← Solicitudes de contacto
│   │   │   ├── messages.py     ← Chat entre usuarios
│   │   │   ├── notifications.py← Notificaciones
│   │   │   ├── reviews.py      ← Reseñas y calificaciones
│   │   │   └── admin.py        ← Panel de administración
│   │   ├── schemas/            ← Esquemas de validación (Pydantic)
│   │   └── utils/              ← Utilidades (JWT, seguridad, Cloudinary)
│   ├── requirements.txt        ← Dependencias de Python
│   ├── seed.py                 ← Script para poblar la base de datos
│   └── nixpacks.toml           ← Configuración de Railway
│
├── frontend/                   ← Aplicación React
│   ├── src/
│   │   ├── App.jsx             ← Rutas principales de la aplicación
│   │   ├── pages/              ← Páginas completas
│   │   │   ├── Home.jsx        ← Página de inicio
│   │   │   ├── Login.jsx       ← Inicio de sesión
│   │   │   ├── Register.jsx    ← Registro de usuarios
│   │   │   ├── Supplies.jsx    ← Catálogo de insumos
│   │   │   ├── SupplyDetail.jsx← Detalle de un insumo
│   │   │   ├── CreateSupply.jsx← Publicar insumo
│   │   │   ├── MySupplies.jsx  ← Mis publicaciones
│   │   │   ├── Profile.jsx     ← Perfil de usuario
│   │   │   ├── Requests.jsx    ← Solicitudes recibidas/enviadas
│   │   │   ├── Messages.jsx    ← Chat privado
│   │   │   ├── Notifications.jsx← Centro de notificaciones
│   │   │   ├── Favorites.jsx   ← Insumos guardados
│   │   │   ├── BloodDonors.jsx ← Búsqueda de donantes de sangre
│   │   │   └── AdminDashboard.jsx← Panel de administración
│   │   ├── components/         ← Componentes reutilizables
│   │   │   ├── Navbar.jsx      ← Barra de navegación
│   │   │   ├── Layout.jsx      ← Estructura base de la app
│   │   │   ├── SupplyCard.jsx  ← Tarjeta de insumo
│   │   │   └── ProtectedRoute.jsx← Rutas que requieren login
│   │   ├── context/            ← Estado global con React Context
│   │   │   ├── AuthContext.jsx ← Estado de autenticación
│   │   │   └── ThemeContext.jsx← Modo oscuro/claro
│   │   └── services/
│   │       └── api.js          ← Todas las llamadas a la API
│   ├── vercel.json             ← Configuración de Vercel (SPA routing)
│   └── package.json            ← Dependencias de Node.js
│
└── render.yaml                 ← Configuración de despliegue
```

---

## 5. BASE DE DATOS

### Sistema de gestión
**PostgreSQL** — base de datos relacional, alojada en **Neon** (nube).

### Tablas (Modelos)

#### Tabla: `users` (Usuarios)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria, auto-incremental |
| email | VARCHAR(255) | Correo único, obligatorio |
| username | VARCHAR(50) | Nombre de usuario único |
| hashed_password | VARCHAR(255) | Contraseña encriptada con bcrypt |
| full_name | VARCHAR(200) | Nombre completo |
| role | ENUM | ADMIN / DONANTE / SOLICITANTE |
| city | VARCHAR(100) | Ciudad del usuario |
| state | VARCHAR(100) | Estado/provincia |
| blood_type | ENUM | A+, A-, B+, B-, AB+, AB-, O+, O- |
| is_blood_donor | BOOLEAN | Si acepta donar sangre |
| rating_avg | FLOAT | Calificación promedio (0-5) |
| avatar_url | VARCHAR(500) | URL de la foto de perfil (Cloudinary) |
| is_verified | BOOLEAN | Si fue verificado por admin |
| created_at | TIMESTAMP | Fecha de registro |

#### Tabla: `supplies` (Insumos)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| title | VARCHAR(200) | Título del insumo |
| description | TEXT | Descripción detallada |
| supply_type | ENUM | donacion / venta / intercambio |
| category | ENUM | ortopedico / rehabilitacion / etc. |
| condition | ENUM | nuevo / seminuevo / usado |
| status | ENUM | disponible / reservado / entregado |
| price | FLOAT | Precio (null si es donación) |
| city | VARCHAR(100) | Ciudad donde está el insumo |
| owner_id | INTEGER | FK → users.id |
| views_count | INTEGER | Número de vistas |
| is_urgent | BOOLEAN | Si se marca como urgente |
| created_at | TIMESTAMP | Fecha de publicación |

#### Tabla: `supply_images` (Imágenes)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| supply_id | INTEGER | FK → supplies.id |
| image_url | VARCHAR(500) | URL permanente en Cloudinary |
| is_primary | BOOLEAN | Si es la imagen principal |

#### Tabla: `contact_requests` (Solicitudes)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| sender_id | INTEGER | FK → users.id (quien solicita) |
| receiver_id | INTEGER | FK → users.id (dueño del insumo) |
| supply_id | INTEGER | FK → supplies.id |
| status | ENUM | PENDIENTE / ACEPTADA / RECHAZADA / COMPLETADA |
| message | TEXT | Mensaje inicial |
| responded_at | TIMESTAMP | Cuando fue respondida |

#### Tabla: `messages` (Mensajes del chat)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| request_id | INTEGER | FK → contact_requests.id |
| sender_id | INTEGER | FK → users.id |
| content | TEXT | Contenido del mensaje |
| is_read | BOOLEAN | Si fue leído |
| created_at | TIMESTAMP | Fecha y hora |

#### Tabla: `notifications` (Notificaciones)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| user_id | INTEGER | FK → users.id |
| type | ENUM | SOLICITUD_NUEVA / ACEPTADA / RECHAZADA / etc. |
| title | VARCHAR(200) | Título corto |
| content | TEXT | Descripción |
| is_read | BOOLEAN | Si fue leída |
| link | VARCHAR(300) | URL a donde lleva la notificación |

#### Tabla: `reviews` (Reseñas)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| reviewer_id | INTEGER | FK → users.id (quien califica) |
| reviewed_id | INTEGER | FK → users.id (quien recibe la califica) |
| request_id | INTEGER | FK → contact_requests.id |
| rating | INTEGER | Calificación del 1 al 5 |
| comment | TEXT | Comentario opcional |

### Relaciones entre tablas
```
users ──< supplies          (Un usuario tiene muchos insumos)
users ──< contact_requests  (Como sender y receiver)
contact_requests ──< messages
contact_requests ──< reviews
supplies ──< supply_images
users ──< notifications
users ──< reviews           (Como reviewer y reviewed)
```

---

## 6. BACKEND — API REST con FastAPI

### ¿Qué es FastAPI?
FastAPI es un framework moderno de Python para crear APIs web. Es muy rápido, genera documentación automática y valida datos automáticamente con Pydantic.

### ¿Qué es una API REST?
Una API REST es un conjunto de reglas para que dos aplicaciones se comuniquen. El frontend envía peticiones HTTP y el backend responde con datos en formato JSON.

### Métodos HTTP utilizados
| Método | Para qué se usa | Ejemplo |
|--------|----------------|---------|
| GET | Obtener datos | Listar insumos |
| POST | Crear algo nuevo | Registrar usuario, publicar insumo |
| PUT | Actualizar algo | Editar perfil, aceptar solicitud |
| DELETE | Eliminar algo | Borrar publicación |

### Endpoints principales de la API

#### Autenticación (`/api/auth`)
```
POST /api/auth/register    ← Crear nueva cuenta
POST /api/auth/login       ← Iniciar sesión (devuelve JWT token)
```

#### Usuarios (`/api/users`)
```
GET  /api/users/me         ← Ver mi perfil
PUT  /api/users/me         ← Editar mi perfil
POST /api/users/me/avatar  ← Subir foto de perfil
GET  /api/users/donors/blood ← Buscar donantes de sangre
GET  /api/users/{id}       ← Ver perfil de otro usuario
```

#### Insumos (`/api/supplies`)
```
GET    /api/supplies        ← Listar insumos (con filtros y paginación)
POST   /api/supplies        ← Publicar insumo
GET    /api/supplies/{id}   ← Ver detalle de insumo
PUT    /api/supplies/{id}   ← Editar insumo
DELETE /api/supplies/{id}   ← Eliminar insumo
POST   /api/supplies/{id}/images  ← Subir imágenes
POST   /api/supplies/{id}/favorite← Guardar en favoritos
```

#### Solicitudes (`/api/requests`)
```
GET  /api/requests          ← Ver mis solicitudes
POST /api/requests          ← Enviar solicitud de contacto
PUT  /api/requests/{id}/accept   ← Aceptar solicitud
PUT  /api/requests/{id}/reject   ← Rechazar solicitud
PUT  /api/requests/{id}/complete ← Marcar como completada
```

#### Mensajes (`/api/messages`)
```
GET  /api/messages                    ← Ver todas mis conversaciones
GET  /api/messages/{request_id}       ← Ver mensajes de una conversación
POST /api/messages/{request_id}       ← Enviar mensaje
```

#### Notificaciones (`/api/notifications`)
```
GET  /api/notifications       ← Ver mis notificaciones
PUT  /api/notifications/read-all ← Marcar todas como leídas
PUT  /api/notifications/{id}/read ← Marcar una como leída
```

#### Reseñas (`/api/reviews`)
```
POST /api/reviews/                    ← Crear reseña
GET  /api/reviews/user/{user_id}      ← Ver reseñas de un usuario
GET  /api/reviews/can-review/{req_id} ← Verificar si puedo reseñar
```

### Autenticación con JWT

**¿Cómo funciona?**
1. El usuario envía su usuario y contraseña al endpoint `/api/auth/login`
2. El backend verifica la contraseña (comparando con el hash bcrypt)
3. Si es correcta, genera un **token JWT** que contiene el ID del usuario y una firma digital
4. El frontend guarda ese token en `localStorage`
5. En cada petición siguiente, el frontend envía el token en el header: `Authorization: Bearer <token>`
6. El backend verifica el token y sabe quién es el usuario

```python
# Ejemplo de cómo se genera el token en Python
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
```

### Seguridad de contraseñas con bcrypt
Las contraseñas nunca se guardan en texto plano. Se usa **bcrypt** para convertirlas en un hash irreversible:

```python
# Al registrarse:
hashed_password = bcrypt.hash("mi_contraseña")
# Resultado: "$2b$12$abc123xyz..." (nunca la contraseña original)

# Al hacer login:
bcrypt.verify("mi_contraseña", hashed_password)  # True o False
```

### ORM con SQLAlchemy
En lugar de escribir SQL directamente, usamos **SQLAlchemy** como ORM (Object Relational Mapper). Esto permite trabajar con la base de datos usando objetos de Python:

```python
# Sin ORM (SQL directo):
cursor.execute("SELECT * FROM supplies WHERE city = 'Guadalajara'")

# Con SQLAlchemy (Python puro):
supplies = db.query(Supply).filter(Supply.city == "Guadalajara").all()
```

### Pydantic — Validación de datos
Pydantic valida automáticamente los datos que llegan a la API:

```python
class SupplyCreate(BaseModel):
    title: str           # Obligatorio, debe ser texto
    price: float | None  # Opcional, debe ser número
    is_urgent: bool = False  # Opcional, default False

# Si alguien envía {"title": 123} → Error automático
# Si alguien envía {"title": "Silla de ruedas"} → OK
```

---

## 7. FRONTEND — Aplicación React

### ¿Qué es React?
React es una biblioteca de JavaScript creada por Meta para construir interfaces de usuario. La idea central son los **componentes** — piezas reutilizables de UI que tienen su propio estado y lógica.

### ¿Qué es una SPA?
Una **Single Page Application** carga una sola vez y no recarga la página al navegar. React Router maneja la navegación cambiando solo los componentes visibles.

### Componentes principales

#### Context (Estado Global)
```jsx
// AuthContext.jsx — maneja si el usuario está logueado
const { user, login, logout } = useAuth();

// ThemeContext.jsx — modo oscuro/claro
const { theme, toggleTheme } = useTheme();
```

#### Hooks utilizados
| Hook | Para qué se usa |
|------|----------------|
| `useState` | Guardar datos en el componente (ej: formularios) |
| `useEffect` | Ejecutar código cuando el componente carga o cambia |
| `useContext` | Acceder al estado global (auth, tema) |
| `useRef` | Referenciar elementos del DOM sin re-renderizar |
| `useCallback` | Memorizar funciones para evitar renders innecesarios |
| `useNavigate` | Navegar programáticamente entre páginas |
| `useParams` | Leer parámetros de la URL (ej: `/supplies/:id`) |
| `useSearchParams` | Leer y escribir query params (filtros en URL) |

#### Ejemplo de componente React
```jsx
// Componente que muestra una tarjeta de insumo
export default function SupplyCard({ supply }) {
  const primaryImage = supply.images?.find(img => img.is_primary);

  return (
    <div className="rounded-xl shadow-md">
      <img src={getMediaUrl(primaryImage?.image_url)} />
      <h3>{supply.title}</h3>
      <p>{supply.city}, {supply.state}</p>
      <span>{supply.supply_type === 'donacion' ? 'Donación' : 'Venta'}</span>
    </div>
  );
}
```

### Llamadas a la API con Axios
```jsx
// services/api.js — centraliza todas las llamadas
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

// Interceptor: agrega el token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Ejemplo de uso en un componente:
useEffect(() => {
  suppliesAPI.getAll({ city: 'Guadalajara' })
    .then(res => setSupplies(res.data.items))
    .catch(() => toast.error('Error al cargar'));
}, []);
```

### Tailwind CSS — Estilos
En lugar de escribir CSS tradicional, Tailwind usa clases utilitarias directamente en el HTML:

```jsx
// CSS tradicional:
// .card { border-radius: 12px; padding: 16px; box-shadow: ... }

// Con Tailwind:
<div className="rounded-xl p-4 shadow-md bg-white hover:shadow-lg transition-all">
```

### Rutas protegidas
Algunas páginas solo son accesibles si el usuario está logueado:

```jsx
// ProtectedRoute.jsx
function ProtectedRoute({ children, adminOnly }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

// En App.jsx:
<Route path="/profile" element={
  <ProtectedRoute><Profile /></ProtectedRoute>
} />
```

---

## 8. FUNCIONALIDADES DETALLADAS

### 8.1 Registro e Inicio de Sesión
- El usuario llena un formulario con nombre, correo, contraseña y rol (Donante o Solicitante)
- La contraseña se encripta con **bcrypt** antes de guardarla
- Al iniciar sesión se genera un **token JWT** válido por 60 minutos
- El token se guarda en `localStorage` del navegador

### 8.2 Publicar Insumos
- El usuario llena título, descripción, categoría, tipo (donación/venta/intercambio), condición y ubicación
- Puede subir hasta 5 fotos que se guardan en **Cloudinary**
- Las imágenes son permanentes (no se pierden)
- El insumo aparece como "Disponible" en el catálogo

### 8.3 Búsqueda y Filtrado
- Filtros por: categoría, tipo, condición, ciudad, estado
- Búsqueda por texto en título y descripción
- Ordenamiento por fecha o vistas
- Los filtros se reflejan en la URL para poder compartir búsquedas

### 8.4 Sistema de Solicitudes
1. Usuario A ve un insumo de Usuario B y hace click en "Solicitar Contacto"
2. Se crea una **solicitud** en estado PENDIENTE
3. Usuario B recibe una **notificación**
4. Usuario B puede Aceptar o Rechazar
5. Si acepta → se abre un **chat** entre ambos
6. Cuando se concreta la entrega → se marca como COMPLETADA
7. Ambos pueden dejarse **reseñas**

### 8.5 Chat Privado
- Solo disponible entre usuarios con solicitud ACEPTADA
- Mensajes en tiempo real usando **polling** (consulta al servidor cada 3 segundos)
- Los mensajes se marcan como leídos automáticamente
- Se muestra si el otro usuario está escribiendo

### 8.6 Sistema de Notificaciones
- Notificaciones automáticas para: nueva solicitud, solicitud aceptada/rechazada, nueva reseña, mensaje nuevo
- Contador de notificaciones no leídas en el navbar
- Opción de marcar todas como leídas

### 8.7 Reseñas y Calificaciones
- Solo disponible cuando la solicitud está COMPLETADA
- Calificación de 1 a 5 estrellas + comentario opcional
- El promedio se calcula y se muestra en el perfil
- Cada usuario solo puede reseñar una vez por transacción

### 8.8 Donantes de Sangre
- Página dedicada para buscar donantes de sangre
- Filtros por tipo de sangre y compatibilidad
- Guía de compatibilidad sanguínea integrada
- Los usuarios pueden registrarse como donantes desde su perfil

### 8.9 Panel de Administración
- Solo accesible para usuarios con rol ADMIN
- Ver estadísticas generales (usuarios, insumos, solicitudes)
- Gestionar usuarios (verificar, activar, desactivar)
- Ver todos los insumos publicados

### 8.10 Modo Oscuro
- El usuario puede cambiar entre tema claro y oscuro
- La preferencia se guarda en `localStorage`
- Implementado con React Context y variables CSS de Tailwind

---

## 9. DESPLIEGUE EN LA NUBE

### Proceso de despliegue

```
Desarrollador → git push → GitHub
                              │
                    ┌─────────┴──────────┐
                    │                    │
              Railway detecta        Vercel detecta
              el push y              el push y
              redespliega            redespliega
              el backend             el frontend
```

### Variables de entorno (configuración segreta)
Las claves y contraseñas nunca se guardan en el código. Se configuran como variables de entorno en cada servicio:

**Railway (Backend):**
```
DATABASE_URL=postgresql://...neon.tech/neondb
SECRET_KEY=clave_super_secreta
CLOUDINARY_CLOUD_NAME=dvegxwcdh
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_ORIGINS=https://life-link-web-sigma.vercel.app
```

**Vercel (Frontend):**
```
VITE_API_BASE_URL=https://lifelinkweb-production.up.railway.app/api
```

### CORS (Cross-Origin Resource Sharing)
Cuando el frontend (Vercel) hace una petición al backend (Railway), los navegadores bloquean esto por seguridad ya que son dominios distintos. Se configura **CORS** en FastAPI para permitir solo el dominio de Vercel:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://life-link-web-sigma.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 10. FLUJO DE DESARROLLO

El proyecto se desarrolló en las siguientes fases:

### Fase 1 — Planificación y estructura
- Definición de funcionalidades y modelos de base de datos
- Configuración del entorno de desarrollo local
- Instalación de herramientas: Python, Node.js, PostgreSQL

### Fase 2 — Backend
- Creación de los modelos de base de datos con SQLAlchemy
- Implementación de autenticación JWT
- Creación de todos los endpoints REST
- Configuración de CORS y archivos estáticos

### Fase 3 — Frontend
- Configuración de React con Vite y Tailwind CSS
- Creación de páginas y componentes
- Integración con la API usando Axios
- Implementación del sistema de rutas y protección

### Fase 4 — Funcionalidades avanzadas
- Sistema de mensajería con polling
- Notificaciones en tiempo real
- Sistema de reseñas y calificaciones
- Búsqueda de donantes de sangre
- Modo oscuro

### Fase 5 — Despliegue
- Configuración de Neon (PostgreSQL en la nube)
- Despliegue del backend en Railway
- Despliegue del frontend en Vercel
- Integración de Cloudinary para imágenes permanentes
- Resolución de problemas de CORS y variables de entorno

---

## 11. GLOSARIO TÉCNICO

| Término | Definición |
|---------|-----------|
| **API REST** | Interfaz de comunicación entre aplicaciones usando HTTP |
| **JSON** | Formato de datos legible por humanos y máquinas |
| **JWT** | Token de autenticación firmado digitalmente |
| **ORM** | Herramienta que mapea tablas de BD a objetos de código |
| **CORS** | Política de seguridad de los navegadores para peticiones entre dominios |
| **SPA** | Aplicación web de una sola página sin recargas |
| **Hash** | Función irreversible para cifrar contraseñas |
| **Endpoint** | URL específica de la API que realiza una acción |
| **Polling** | Consultar el servidor repetidamente para ver cambios |
| **Deploy** | Publicar la aplicación en un servidor de producción |
| **CDN** | Red de distribución de contenido (imágenes en Cloudinary) |
| **Hook** | Función especial de React para usar estado y ciclo de vida |
| **Middleware** | Código que se ejecuta entre la petición y la respuesta |

---

## 12. DATOS DEL PROYECTO

- **Nombre:** LifeLink Medical
- **Versión:** 1.0.0
- **Repositorio:** github.com/vilaloboscarlos74-lgtm/LifeLinkWeb
- **Frontend:** https://life-link-web-sigma.vercel.app
- **Backend API:** https://lifelinkweb-production.up.railway.app
- **Documentación API:** https://lifelinkweb-production.up.railway.app/api/docs

---

*Documento generado para presentación escolar — LifeLink Medical Platform*
