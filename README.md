# JustWatch Scanner

Herramienta CLI para escanear películas y series agregadas a plataformas de streaming en Argentina usando la API no oficial de JustWatch.

## Características

- 🆕 Ver títulos agregados recientemente a las plataformas
- 🔍 Buscar títulos con múltiples filtros
- 📺 Soporte para películas y series
- 🎭 Filtrar por género, año, plataforma
- 💰 Filtrar por tipo de disponibilidad (streaming, alquiler, compra)
- 📊 Exportar resultados a JSON o CSV

## Instalación

```bash
# Clonar o copiar el proyecto
cd justwatch-scanner

# Instalar dependencias
npm install

# Ejecutar
npm start
```

## Uso

La aplicación tiene una interfaz interactiva. Al ejecutar `npm start` verás un menú con opciones:

1. **Ver títulos agregados recientemente**: Muestra películas/series que fueron agregadas a las plataformas en un período específico.

2. **Buscar títulos con filtros**: Búsqueda general con todos los filtros disponibles.

3. **Ver plataformas disponibles**: Lista todas las plataformas de streaming en Argentina.

4. **Ver géneros disponibles**: Lista todos los géneros disponibles.

## Filtros disponibles

- **Plataformas**: Netflix, Prime Video, Disney+, Max, Paramount+, Apple TV+, MUBI, Crunchyroll, etc.
- **Tipo de contenido**: Películas, series o ambos
- **Géneros**: Acción, comedia, drama, terror, ciencia ficción, etc.
- **Año de estreno**: Rango de años (desde - hasta)
- **Tipo de disponibilidad**:
  - Suscripción (streaming incluido)
  - Alquiler
  - Compra
  - Gratis
  - Gratis con anuncios
- **Período de agregado**: Última semana, 15 días, mes, 3 meses

## Exportación

Los resultados de "títulos nuevos" pueden exportarse a:
- **JSON**: Datos completos estructurados
- **CSV**: Para abrir en Excel/Google Sheets

## Estructura del proyecto

```
justwatch-scanner/
├── src/
│   ├── index.ts    # Entrada principal
│   ├── cli.ts      # Interfaz de línea de comandos
│   ├── api.ts      # Cliente de la API GraphQL
│   └── types.ts    # Definiciones de tipos TypeScript
├── package.json
└── tsconfig.json
```

## API utilizada

Esta herramienta usa la API GraphQL no oficial de JustWatch (`https://apis.justwatch.com/graphql`). 

**Importante**: Esta API no es oficial y puede cambiar sin previo aviso. JustWatch prohíbe el uso comercial de su API. Esta herramienta es solo para uso personal.

## Uso programático

También podés usar las funciones directamente:

```typescript
import { getNewTitles, searchTitles, getProviders } from './src/api.js';

// Obtener proveedores
const providers = await getProviders('AR');

// Buscar títulos nuevos en Netflix de la última semana
const results = await getNewTitles({
  country: 'AR',
  language: 'es',
  providers: ['nfx'],
  objectTypes: ['MOVIE'],
  monetizationTypes: ['FLATRATE'],
  dateAddedFrom: '2025-01-05',
  first: 50,
});

// Buscar películas de terror
const horror = await searchTitles({
  country: 'AR',
  language: 'es',
  genres: ['hrr'],
  objectTypes: ['MOVIE'],
  first: 20,
});
```

## Notas

- El país está configurado para Argentina (`AR`) pero se puede cambiar fácilmente en el código.
- La API tiene rate limiting, usá la herramienta con moderación.
- Los datos pueden no estar 100% actualizados en tiempo real.

## Licencia

MIT - Uso personal únicamente. No usar comercialmente sin autorización de JustWatch.
