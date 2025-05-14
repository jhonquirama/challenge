# API de Notificación de Eventos

Este proyecto implementa una API REST para la gestión de notificaciones de eventos siguiendo una arquitectura hexagonal.

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

## Requisitos

- Node.js 14+
- npm o yarn

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```
   npm install
   ```
3. Configurar variables de entorno (copiar `.env.example` a `.env` y ajustar valores)

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

### Pruebas

```
npm test
```

## Seguridad

Se han implementado las siguientes medidas de seguridad:

1. Uso de Helmet para protección de cabeceras HTTP
2. Validación de datos de entrada
3. Manejo adecuado de errores

## Próximos Pasos

- Implementar autenticación y autorización
- Migrar a una base de datos persistente (PostgreSQL)
- Implementar sistema de colas para manejo asíncrono de eventos (Kafka)
- Añadir observabilidad (logs, métricas, trazas)