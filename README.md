# Proyecto Huevos Pascua

Aplicacion web para una busqueda de huevos de pascua con registro de usuarios, escaneo QR, progreso por jugador y notificaciones en tiempo real.

## Estructura

- `backend/`: API con Express, PostgreSQL, JWT y Socket.IO.
- `frontend/`: sitio estatico listo para publicar en Netlify.
- `backend/schema.sql`: crea las tablas e inserta los 10 huevos base.

## Backend local

1. Entra a [backend/package.json](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/package.json).
2. Instala dependencias:

```powershell
cd backend
npm.cmd install
```

3. Configura [backend/.env](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/.env) con tus valores reales.
   Puedes copiar [backend/.env.example](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/.env.example) como base.
4. Crea la base de datos `easter_egg` en PostgreSQL y ejecuta el esquema:

```powershell
psql -U postgres -d easter_egg -f schema.sql
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

Durante desarrollo local, [frontend/script.js](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/frontend/script.js) apunta automaticamente a `http://localhost:3001`.

## Despliegue en Railway

1. Sube la carpeta `backend`.
2. Railway detectara Node.js usando [backend/package.json](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/package.json).
3. Define estas variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT`
4. Ejecuta [backend/schema.sql](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/schema.sql) sobre tu base PostgreSQL.
5. Usa `npm start` como comando de arranque si Railway no lo detecta solo.

## Despliegue en Netlify

1. Publica la carpeta `frontend`.
2. En [frontend/script.js](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/frontend/script.js), cambia `https://tu-backend.railway.app` por tu URL real de Railway.
3. Vuelve a desplegar Netlify despues de ese cambio.
4. El backend ya acepta dominios `*.netlify.app` desde CORS.

## Notas

- El login tiene una interfaz interactiva en azul, negro y amarillo.
- Al escanear correctamente un QR se muestra una animacion de huevo.
- Si vas a usar tu propio dominio en Netlify, agregalo tambien al arreglo `allowedOrigins` en [backend/index.js](C:/Users/rquevedo/Music/huevo%20de%20pascua/proyecto-huevos-pascua/backend/index.js).
