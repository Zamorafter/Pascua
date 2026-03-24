# Proyecto Huevos Pascua

Aplicacion web para una busqueda de huevos de pascua con registro de usuarios, escaneo QR, progreso por jugador y notificaciones en tiempo real.

## Estructura

- `backend/`: API con Express, PostgreSQL, JWT y Socket.IO.
- `frontend/`: sitio estatico listo para publicar en Netlify.
- `backend/schema.sql`: crea las tablas del juego y carga 80 QR (20 premios reales y 60 falsos).

## Backend local

1. Entra a [backend/package.json](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/package.json).
2. Instala dependencias:

```powershell
cd backend
npm.cmd install
```

3. Configura [backend/.env](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/.env) con tus valores reales.
   Puedes copiar [backend/.env.example](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/.env.example) como base.
4. Crea la base de datos `easter_egg` en PostgreSQL y ejecuta la migracion:

```powershell
cd backend
npm.cmd run migrate
```

5. Inicia el backend:

```powershell
npm.cmd start
```

El servidor quedara en `http://localhost:3001`.

## Pruebas

Para correr la prueba de humo del backend:

```powershell
cd backend
npm.cmd test
```

La prueba valida que los modulos principales carguen y exporten lo esperado.

## Frontend local

El frontend es estatico. Puedes abrir [frontend/index.html](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/frontend/index.html) con Live Server o cualquier hosting estatico.

Durante desarrollo local, [frontend/config.js](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/frontend/config.js) apunta a `http://localhost:3001`.

## Despliegue en Railway

1. Sube la carpeta `backend`.
2. Railway detectara Node.js usando [backend/package.json](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/package.json).
3. Define estas variables de entorno:
   - `DATABASE_URL=${{ Postgres.DATABASE_URL }}`
   - `JWT_SECRET`
   - `PORT`
4. Ejecuta la migracion del backend:

```bash
npm run migrate
```

5. Usa `npm start` como comando de arranque si Railway no lo detecta solo.
6. Copia la URL publica del backend, por ejemplo `https://tu-backend-production.up.railway.app`.
7. Verifica que Railway responda abriendo `https://tu-backend-production.up.railway.app/api/health`.

## Despliegue en Netlify

1. Conecta este repositorio a Netlify.
2. Deja estos valores:
   - Base directory: vacio
   - Build command: `node scripts/generate-config.js`
   - Publish directory: `frontend`
3. En variables de entorno de Netlify agrega:
   - `API_BASE_URL=https://tu-backend-production.up.railway.app`
4. Lanza el deploy.
5. Netlify generara automaticamente [frontend/config.js](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/frontend/config.js) con la URL correcta del backend.
6. El backend ya acepta dominios `*.netlify.app` desde CORS.

## Flujo final recomendado

1. Crea PostgreSQL en Railway.
2. En el servicio backend de Railway define `DATABASE_URL=${{ Postgres.DATABASE_URL }}`, `JWT_SECRET` y `PORT`.
3. Sube el backend a Railway y ejecuta `npm run migrate`.
4. Copia la URL publica de Railway.
5. Conecta este repositorio a Netlify.
6. En Netlify define `API_BASE_URL` con la URL de Railway.
7. Despliega y prueba registro, login y escaneo desde el sitio publicado.

## Notas

- El login tiene una interfaz interactiva en azul, negro y amarillo.
- Al escanear correctamente un QR se muestra una animacion de huevo.
- Si vas a usar tu propio dominio en Netlify, agregalo tambien al arreglo `allowedOrigins` en [backend/index.js](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/index.js).
