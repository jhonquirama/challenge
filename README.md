# Notification Events API

API para notificación de eventos con arquitectura hexagonal.

## Estructura del Proyecto

El proyecto sigue una arquitectura hexagonal (también conocida como Ports and Adapters) con la siguiente estructura:

```
.
├── src
│   ├── core                     # Lógica de negocio pura
│   │   ├── domain               # Entidades y modelos de dominio
│   │   ├── ports                # Interfaces definidas por el core
│   │   │   ├── input            # Interfaces para los casos de uso
│   │   │   └── output           # Interfaces para lo que el core necesita del exterior
│   │   └── use_cases            # Implementaciones de los puertos de entrada
│   │
│   ├── infrastructure           # Implementaciones concretas de los puertos
│   │   ├── driving_adapters     # Adaptadores que INICIAN la acción en el core
│   │   │   ├── rest_api         # Para API REST
│   │   │   └── health           # Para health check
│   │   ├── driven_adapters      # Adaptadores que SON LLAMADOS por el core
│   │   │   └── persistence      # Para persistencia de datos
│   │   └── config               # Configuración de la infraestructura
│   │
│   ├── shared                   # Código compartido
│   │   └── utils                # Utilidades
│   │
│   └── main.ts                  # Punto de entrada
│
├── tests                        # Tests
├── package.json
├── tsconfig.json
└── .env
```

## Requisitos

- Node.js (v14 o superior)
- npm o yarn

## Instalación

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

## Ejecución

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## Endpoints

### Health Check

```
GET /health
```

## Seguridad

El proyecto implementa las siguientes medidas de seguridad:

1. Helmet para protección de cabeceras HTTP
2. Validación de datos de entrada
3. Autenticación (middleware preparado para implementar)

## Desarrollo

Para ejecutar los tests:

```bash
npm test
```