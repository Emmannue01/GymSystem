# Configuración de Vercel para Seguridad

## ¿Qué variables se muestran en el build?

En React, **TODAS** las variables con prefijo `REACT_APP_` se incluyen en el bundle final (esto es seguro porque:

### ✅ Variables Firebase (SEGURAS en el cliente):
- `REACT_APP_FIREBASE_API_KEY` ← Pública por diseño
- `REACT_APP_FIREBASE_PROJECT_ID` ← Pública por diseño
- Las reglas de Firestore/Storage protegen los datos

### ❌ Variables que NUNCA incluyas:
- `FIREBASE_ADMIN_SDK_KEY` ← Secreto del servidor
- `DATABASE_PASSWORD` ← Contraseña de BD
- `JWT_SECRET` ← Token secreto
- Cualquier cosa sin `REACT_APP_` no se incluye

## Configuración en Vercel

### Opción 1: Usando vercel.json (YA CONFIGURADO)
El archivo `vercel.json` especifica qué variables usar.

### Opción 2: En Dashboard de Vercel
1. Ve a: **Settings → Environment Variables**
2. Para cada variable, marca solo:
   - ✅ **Development** (desarrollo local)
   - ✅ **Preview** (rama antes de merge)
   - ✅ **Production** (deploy principal)

### Opción 3: Comando CLI (alternativo)
```powershell
vercel env pull .env.local
```

## Variables por entorno

Vercel permite diferentes valores por entorno:

**Production (vercel.com):**
```
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto-prod
```

**Preview (PR/branches):**
```
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto-preview
```

**Development (local):**
```
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto-dev
```

## Verificar qué se incluye en el build

Ejecuta en tu terminal:
```powershell
npm run build
npm start  # O vercel --prod
```

Luego abre DevTools (F12) → Network → cualquier archivo `.js`:
- Busca `REACT_APP_FIREBASE_PROJECT_ID`
- Si aparece, es normal (está diseñado así)

## Mejor práctica: Proteger datos reales

Para mayor seguridad, usa **dos proyectos Firebase**:

**Proyecto 1 (PÚBLICO - Desarrollo/Demo):**
- Datos de prueba
- Reglas de Firestore más restrictivas
- Expuesto en el bundle

**Proyecto 2 (PRIVADO - Producción):**
- Datos reales del cliente
- Reglas muy estrictas
- Solo acceso autenticado

En `vercel.json`, usa diferentes IDs para cada ambiente.

## Verificación final antes de deploy

✅ Ejecuta esto antes de hacer push:
```powershell
npm run security-check
npm run build
# Revisa que build/ se haya generado correctamente
```

✅ En Vercel Dashboard:
- Settings → Environment Variables
- Verifica que todas las REACT_APP_* estén configuradas
- Haz Redeploy

✅ En Firebase Console:
- Firestore Rules → Verifica que estén restrictivas
- Storage Rules → Verifica que estén restrictivas
- Authentication → Activa solo métodos necesarios
