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

### Autenticación

Todas las peticiones requieren una API key válida en el header `X-API-Key`.

### Autorización

Las peticiones deben incluir un ID de cliente en el header `X-Client-Id`. Un cliente solo puede acceder a sus propios eventos.

## Desarrollo

### Scripts disponibles

- `npm run dev`: Inicia la aplicación en modo desarrollo con recarga automática
- `npm run build`: Compila el código TypeScript
- `npm start`: Inicia la aplicación compilada
- `npm test`: Ejecuta los tests
- `npm run test:coverage`: Ejecuta los tests con informe de cobertura
- `npm run lint`: Ejecuta el linter
- `npm run format`: Formatea el código con Prettier
- `npm run migrate:up`: Ejecuta las migraciones pendientes
- `npm run migrate:down`: Revierte la última migración
- `npm run migrate:create`: Crea una nueva migración

## Arquitectura

El proyecto sigue la arquitectura hexagonal (puertos y adaptadores):

- **Core**: Contiene la lógica de negocio pura
  - **Domain**: Entidades y modelos
  - **Ports**: Interfaces que definen cómo el core interactúa con el exterior
  - **Use Cases**: Implementaciones de los casos de uso

- **Infrastructure**: Implementaciones concretas
  - **Driven Adapters**: Adaptadores secundarios (BD, servicios externos)
  - **Driving Adapters**: Adaptadores primarios (API REST)

## Seguridad

Implementa las siguientes medidas de seguridad según OWASP:

- Validación de entradas
- Autenticación mediante API Key
- Autorización basada en cliente
- Cabeceras de seguridad
- Limitación de tasa de peticiones
- Manejo centralizado de errores
- Logging seguro

## CI/CD

El proyecto utiliza GitHub Actions para:

- Linting y verificación de código
- Ejecución de tests
- Verificación de cobertura
- Compilación
- Despliegue a entornos de desarrollo y producción

## Licencia

[MIT](LICENSE)