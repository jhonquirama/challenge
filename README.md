# API de Notificación de Eventos

Este proyecto implementa una API REST para la gestión de notificaciones de eventos siguiendo una arquitectura hexagonal.

![CI](https://github.com/usuario/notification-events-api/workflows/CI/badge.svg)

## Estructura del Proyecto

La estructura del proyecto sigue los principios de la arquitectura hexagonal (puertos y adaptadores):

```
.
├── src
│   ├── core                     # Lógica de negocio pura
│   │   ├── domain               # Entidades y modelos de dominio
│   │   ├── ports                # Interfaces definidas por el core
│   │   │   ├── input            # Puertos de entrada (casos de uso)
│   │   │   └── output           # Puertos de salida (repositorios, servicios)
│   │   └── use_cases            # Implementaciones de los casos de uso
│   │
│   ├── infrastructure           # Implementaciones concretas
│   │   ├── driving_adapters     # Adaptadores primarios (API REST)
│   │   ├── driven_adapters      # Adaptadores secundarios (BD, servicios externos)
│   │   └── config               # Configuración
│   │
│   ├── shared                   # Código compartido
│   └── main.ts                  # Punto de entrada
│
├── migrations                   # Migraciones de base de datos
│
├── tests                        # Pruebas
│   ├── unit
│   ├── integration
│   └── e2e
│
├── package.json
├── tsconfig.json
└── .env
```

## Funcionalidades Implementadas

### API REST para Notificaciones de Eventos

- `GET /notification_events`: Obtiene todos los eventos de notificación con filtros opcionales
  - Filtros: clientId, startDate, endDate, deliveryStatus
- `GET /notification_events/{id}`: Obtiene un evento de notificación específico
- `POST /notification_events/{id}/replay`: Reenvía un evento de notificación fallido

### Sistema de Reintentos

- Estrategia de backoff exponencial para reintentos
- Trabajo programado para procesar eventos pendientes
- Registro detallado de intentos de entrega

### Persistencia con PostgreSQL

- Migraciones versionadas para evolución del esquema
- Transacciones para garantizar integridad de datos
- Índices para optimizar consultas frecuentes

## CI/CD

El proyecto utiliza GitHub Actions para automatizar:

- **Integración Continua**: Linting, pruebas y build
- **Entrega Continua**: Despliegue automático a entornos de desarrollo y producción
- **Cobertura de Código**: Verificación de cobertura mínima del 80%

## Requisitos

- Node.js 18+
- PostgreSQL 12+
- npm o yarn

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```
   npm install
   ```
3. Configurar variables de entorno (copiar `.env.example` a `.env` y ajustar valores)
4. Asegurarse de que PostgreSQL esté en ejecución
5. Ejecutar migraciones:
   ```
   npm run migrate:up
   ```

## Ejecución

### Desarrollo

```
npm run dev
```

### Producción

```
npm run build
npm start
```

### Docker

```
docker-compose up -d
```

### Pruebas

```
npm test
```

## Seguridad

Se han implementado las siguientes medidas de seguridad:

1. Uso de Helmet para protección de cabeceras HTTP
2. Validación de datos de entrada
3. Autenticación mediante API Key
4. Autorización basada en cliente
5. Limitación de tasa de peticiones

## Documentación

- `/docs/SECURITY.md`: Análisis de seguridad y mitigaciones
- `/docs/MIGRATIONS.md`: Sistema de migraciones de base de datos
- `/docs/RETRY_STRATEGY.md`: Estrategia de reintentos implementada