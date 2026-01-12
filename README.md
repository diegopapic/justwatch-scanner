# JustWatch Scanner Argentina

Explorador del catálogo de streaming en Argentina.

## Funcionalidades

- 🆕 Ver títulos agregados recientemente por plataforma
- 🔍 Explorar catálogo con filtros
- 🔎 Buscar por nombre
- Filtros: plataformas, tipo, países, años, exclusividad
- Exportar a JSON/CSV
- Configuración persistente

## Instalación local

```bash
npm install
npm start
```

Abrir http://localhost:3000

## Deploy en Render.com (gratis)

1. Subí este código a un repositorio de GitHub

2. Andá a [render.com](https://render.com) y creá una cuenta

3. Click en **New** → **Web Service**

4. Conectá tu cuenta de GitHub y seleccioná el repositorio

5. Configurá:
   - **Name**: justwatch-scanner (o el que quieras)
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

6. Seleccioná el plan **Free**

7. Click en **Create Web Service**

En unos minutos vas a tener tu URL tipo: `https://justwatch-scanner.onrender.com`

> ⚠️ El plan gratuito "duerme" después de 15 minutos de inactividad. La primera visita puede tardar ~30 segundos en despertar.

## Estructura

```
├── server.js        # Backend Express + proxy API JustWatch
├── public/
│   └── index.html   # Frontend
├── package.json
└── README.md
```
