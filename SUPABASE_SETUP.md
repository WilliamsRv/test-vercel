# Configuración de Supabase Storage para Archivos Adjuntos

## 1. Crear cuenta en Supabase
1. Ve a https://supabase.com
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto

## 2. Obtener credenciales
1. Ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
3. Pega estos valores en tu archivo `.env`

## 3. Crear Bucket de Storage
1. Ve a **Storage** en el menú lateral
2. Click en **Create bucket**
3. Configura el bucket:
   - **Name**: `asset-documents`
   - **Public**: ✅ Marcar como público
   - Click en **Create bucket**

## 4. Configurar Policies (Políticas de Acceso)

### Policy 1: Lectura Pública
Permite que cualquiera pueda ver/descargar los archivos subidos:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'asset-documents' );
```

### Policy 2: Subida Autenticada (Opcional)
Si quieres que solo usuarios autenticados suban archivos:

```sql
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'asset-documents' 
  AND auth.role() = 'authenticated'
);
```

### Policy 3: Subida Pública (Alternativa)
Si quieres permitir subida sin autenticación:

```sql
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'asset-documents' );
```

### Policy 4: Eliminación
Permitir eliminar archivos:

```sql
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'asset-documents' );
```

## 5. Aplicar Policies
1. Ve a **Storage** > **asset-documents** > **Policies**
2. Click en **New Policy**
3. Selecciona **Custom** o **Full customization**
4. Pega las queries SQL de arriba
5. Click en **Review** y luego **Save policy**

## 6. Verificar configuración
Para probar que todo funciona:
1. Inicia tu aplicación
2. Ve al módulo de Bienes Patrimoniales
3. Crea o edita un bien
4. Ve a la pestaña "Documentación"
5. Intenta subir un archivo
6. Verifica que aparezca en la lista de archivos subidos

## 7. Ver archivos en Supabase
1. Ve a **Storage** > **asset-documents**
2. Deberías ver la carpeta `patrimonio/`
3. Dentro encontrarás las carpetas organizadas por código de activo
4. Cada archivo tendrá un nombre único con timestamp

## Estructura de archivos en Storage:
```
asset-documents/
└── patrimonio/
    └── {assetCode}/
        ├── {assetCode}_{timestamp}_archivo1.pdf
        ├── {assetCode}_{timestamp}_archivo2.jpg
        └── ...
```

## Límites por defecto de Supabase:
- **Free tier**: 1 GB de storage
- **Pro tier**: 100 GB de storage
- **Tamaño máximo por archivo**: 50 MB (configurable)
- **Nuestra app limita a**: 5 MB por archivo, máximo 5 archivos

## Tipos de archivo soportados:
- Documentos: PDF, DOC, DOCX
- Imágenes: JPG, JPEG, PNG, WEBP

## Troubleshooting

### Error: "No se puede conectar a Supabase"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el proyecto de Supabase esté activo

### Error: "No se puede subir archivo"
- Verifica que el bucket exista y se llame exactamente `asset-documents`
- Verifica que las policies permitan INSERT
- Verifica el tamaño del archivo (máx 5MB)

### Error: "No se puede ver el archivo"
- Verifica que el bucket sea público
- Verifica que la policy de SELECT esté activa

### Los archivos no se guardan en la base de datos
- El campo `attachedDocuments` debe existir en tu tabla `bienes_patrimoniales`
- El campo debe ser de tipo `TEXT` o `JSON`

## Seguridad

⚠️ **IMPORTANTE**: 
- Nunca subas las credenciales de Supabase a GitHub
- El archivo `.env` debe estar en `.gitignore`
- Usa solo la clave `anon/public` (nunca la `service_role` key en el frontend)
- Las policies de Supabase protegen tu bucket

## Backup recomendado
Configura backups automáticos en Supabase:
1. Ve a **Settings** > **Backups**
2. Habilita backups diarios
3. Mantén al menos 7 días de backup
