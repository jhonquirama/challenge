# API de Eventos de Notificación

API para gestionar eventos de notificación con arquitectura hexagonal, implementando patrones de seguridad OWASP y sistema de reintentos.

## Características

- Arquitectura Hexagonal (Puertos y Adaptadores)
- API REST con Express
- Base de datos PostgreSQL
- Sistema de reintentos con backoff exponencial
- Seguridad según recomendaciones OWASP
- CI/CD con GitHub Actions
- Tests unitarios y de integración
- Documentación de API con Swagger
- Observabilidad con Prometheus y Grafana
- Suscripciones a eventos por cliente

## Estructura del Proyecto

```
src/
├── core/                      # Capa de dominio y casos de uso
│   ├── domain/                # Entidades y modelos
│   ├── ports/                 # Interfaces (puertos)
│   │   ├── input/             # Puertos primarios (casos de uso)
│   │   └── output/            # Puertos secundarios (repositorios, servicios)
│   └── use_cases/             # Implementación de casos de uso
├── infrastructure/            # Capa de infraestructura
│   ├── config/                # Configuración de la aplicación
│   ├── driven_adapters/       # Adaptadores secundarios
│   │   ├── persistence/       # Implementaciones de repositorios
│   │   ├── retry/             # Estrategias de reintento
│   │   └── webhook/           # Servicios de webhook
│   ├── driving_adapters/      # Adaptadores primarios
│   │   └── rest_api/          # API REST
│   │       ├── controllers/   # Controladores
│   │       ├── middlewares/   # Middlewares
│   │       └── routes/        # Rutas
│   ├── jobs/                  # Trabajos programados
│   └── scripts/               # Scripts de utilidad
└── shared/                    # Utilidades compartidas
    └── utils/                 # Utilidades generales
```

## Migraciones de Base de Datos

El proyecto utiliza `node-pg-migrate` para gestionar las migraciones de base de datos:

- `1684000000000_create_notification_events_table.js`: Crea las tablas principales y sus índices
- `1684000000001_seed_notification_events.js`: Carga datos de ejemplo
- `1684000000002_create_event_subscriptions_table.js`: Crea la tabla de suscripciones a eventos

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker y Docker Compose (opcional)

## Instalación

### Con Docker

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/notification-events-api.git
   cd notification-events-api
   ```

2. Crear archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Iniciar los contenedores:
   ```bash
   docker-compose up -d
   ```

### Sin Docker

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/notification-events-api.git
   cd notification-events-api
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

4. Configurar PostgreSQL y actualizar el archivo .env con los datos de conexión.

5. Ejecutar migraciones:
   ```bash
   npm run migrate:up
   ```

6. Iniciar la aplicación:
   ```bash
   npm run dev
   ```

## Uso

### Endpoints

- `GET /notification_events`: Obtener todos los eventos de notificación (con filtros opcionales)
- `GET /notification_events/:id`: Obtener un evento específico por ID
- `POST /notification_events/:id/replay`: Reenviar un evento fallido
- `GET /metrics`: Obtener métricas de Prometheus
- `GET /health`: Verificar el estado de la aplicación

### Autenticación

Todas las peticiones requieren una API key válida en el header `X-API-Key`.

### Autorización

Las peticiones deben incluir un ID de cliente en el header `X-Client-Id`. Un cliente solo puede acceder a sus propios eventos.

## Observabilidad

La aplicación incluye:

- **Logging**: Implementado con Winston para registrar eventos y errores
- **Métricas**: Exposición de métricas en formato Prometheus en `/metrics`
- **Dashboard**: Grafana preconfigurado para visualizar métricas

Para acceder a los dashboards:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (usuario: admin, contraseña: admin)

## Desarrollo

### Scripts disponibles

- `npm run dev`: Inicia la aplicación en modo desarrollo con recarga automática
- `npm run build`: Compila el código TypeScript
- `npm start`: Inicia la aplicación compilada
- `npm test`: Ejecuta los tests unitarios
- `npm run test:coverage`: Ejecuta los tests con informe de cobertura
- `npm run test:integration`: Ejecuta los tests de integración
- `npm run lint`: Ejecuta el linter
- `npm run format`: Formatea el código con Prettier
- `npm run migrate:up`: Ejecuta las migraciones pendientes
- `npm run migrate:down`: Revierte la última migración
- `npm run migrate:create`: Crea una nueva migración

## Seguridad

Implementa las siguientes medidas de seguridad según OWASP:

- Validación de entradas
- Autenticación mediante API Key
- Autorización basada en cliente
- Cabeceras de seguridad
- Limitación de tasa de peticiones
- Manejo centralizado de errores
- Logging seguro

## Licencia

[MIT](LICENSE)