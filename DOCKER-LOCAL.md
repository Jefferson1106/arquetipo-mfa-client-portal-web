# 🐳 Guía para Ejecutar Docker en Local

Este documento explica cómo usar Docker para desarrollo local, apuntando al backend local en lugar de producción.

## 📋 Prerequisitos

1. **Docker Desktop** instalado en Windows
2. **Backend corriendo** en tu máquina local en el puerto `9090`
3. Git Bash o PowerShell

---

## 🚀 Opción 1: Docker Compose Local (RECOMENDADO)

### **Paso 1: Verificar que el backend esté corriendo**
```bash
# Desde el directorio del backend
cd ../spf-msa-client-core-service
docker run -p 9090:9090 client-core-service.jar

# O si lo corres con Maven/Gradle:
mvn spring-boot:run
# O
./gradlew bootRun
```

Verifica que esté accesible en: http://localhost:9090

### **Paso 2: Construir y levantar el frontend con Docker**
```bash
# Desde el directorio del proyecto frontend
cd arquetipo-mfa-client-portal-web

# Opción A: Usando docker-compose.local.yml
docker-compose -f docker-compose.local.yml up --build

# Opción B: En segundo plano (detached)
docker-compose -f docker-compose.local.yml up -d --build
```

### **Paso 3: Acceder a la aplicación**
- Frontend: http://localhost:4200
- Backend: http://localhost:9090

### **Paso 4: Ver logs (si está en segundo plano)**
```bash
docker-compose -f docker-compose.local.yml logs -f
```

### **Paso 5: Detener el contenedor**
```bash
docker-compose -f docker-compose.local.yml down
```

---

## 🔧 Opción 2: Docker Build Manual

### **Construir la imagen para desarrollo local**
```bash
# Construir imagen con Dockerfile.local
docker build -f Dockerfile.local -t banking-portal:local .
```

### **Ejecutar el contenedor**
```bash
docker run -p 4200:4200 --add-host=host.docker.internal:host-gateway banking-portal:local
```

---

## 🌐 Configuración de Rutas

### **Desarrollo Local**
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:9090/spf-msa-client-core-service
- **Proxy Nginx**: El contenedor usa `host.docker.internal:9090` para alcanzar tu backend local

### **Producción**
- **Frontend**: http://vps-5405471-x.dattaweb.com:4200
- **Backend API**: http://vps-5405471-x.dattaweb.com:9090/spf-msa-client-core-service

---

## 📂 Estructura de Archivos

```
arquetipo-mfa-client-portal-web/
│
├── docker-compose.yml           # Para PRODUCCIÓN
├── docker-compose.local.yml     # Para DESARROLLO LOCAL ⭐
├── Dockerfile                   # Para PRODUCCIÓN
├── Dockerfile.local             # Para DESARROLLO LOCAL ⭐
│
└── nginx/
    ├── nginx.prod.conf          # Configuración producción
    └── nginx.local.conf         # Configuración desarrollo local ⭐
```

---

## 🔍 Troubleshooting

### **Problema: No puedo conectar con el backend local**

**Solución 1**: Verifica que el backend esté corriendo
```bash
curl http://localhost:9090/spf-msa-client-core-service/actuator/health
```

**Solución 2**: Verifica que Docker pueda acceder a host.docker.internal
```bash
docker run --rm --add-host=host.docker.internal:host-gateway alpine ping -c 4 host.docker.internal
```

**Solución 3**: En algunos casos de Windows, usa la IP de tu máquina
```bash
# Obtén tu IP local
ipconfig
# Busca "IPv4 Address" (ej: 192.168.1.100)

# Modifica nginx/nginx.local.conf línea 62:
proxy_pass http://192.168.1.100:9090/spf-msa-client-core-service/;
```

### **Problema: El contenedor no inicia**

**Limpiar caché y reconstruir**
```bash
docker-compose -f docker-compose.local.yml down
docker system prune -a
docker-compose -f docker-compose.local.yml up --build
```

### **Problema: CORS errors**

La configuración `nginx.local.conf` ya incluye headers CORS. Si persiste:

1. Verifica que el backend tenga CORS habilitado
2. Revisa los logs del contenedor:
```bash
docker-compose -f docker-compose.local.yml logs web
```

---

## 🎯 Comandos Útiles

### **Ver contenedores activos**
```bash
docker ps
```

### **Ver logs en tiempo real**
```bash
docker-compose -f docker-compose.local.yml logs -f web
```

### **Reiniciar contenedor**
```bash
docker-compose -f docker-compose.local.yml restart
```

### **Ejecutar comandos dentro del contenedor**
```bash
docker-compose -f docker-compose.local.yml exec web sh
```

### **Eliminar todos los contenedores**
```bash
docker-compose -f docker-compose.local.yml down -v
```

---

## 📊 Comparación: Local vs Producción

| Aspecto | Desarrollo Local | Producción |
|---------|------------------|------------|
| **Comando** | `docker-compose -f docker-compose.local.yml up` | `docker-compose up` |
| **Dockerfile** | `Dockerfile.local` | `Dockerfile` |
| **Nginx Config** | `nginx.local.conf` | `nginx.prod.conf` |
| **Backend URL** | `http://host.docker.internal:9090` | `http://vps-5405471-x.dattaweb.com:9090` |
| **Build** | `npm run build` | `npm run build:prod` |
| **CORS** | Habilitado | Restringido |

---

## ✅ Workflow Recomendado

### **Para Desarrollo Local**
```bash
# 1. Levantar backend local
cd ../spf-msa-client-core-service
docker run -p 9090:9090 client-core-service.jar

# 2. En otra terminal, levantar frontend con Docker
cd arquetipo-mfa-client-portal-web
docker-compose -f docker-compose.local.yml up --build

# 3. Desarrollar y probar en http://localhost:4200
```

### **Para Desarrollo sin Docker (más rápido)**
```bash
# Backend local corriendo en puerto 9090
npm start
# Frontend disponible en http://localhost:4200 con proxy automático
```

### **Para Deploy a Producción**
```bash
# Construir y subir
docker-compose up --build -d
# O con CI/CD configurado
git push origin main
```

---

## 🎓 Notas Importantes

1. ✅ **`host.docker.internal`** es una feature de Docker Desktop para Windows/Mac que apunta a tu máquina host
2. ✅ El archivo `docker-compose.local.yml` usa `extra_hosts` para habilitar esta feature
3. ✅ La configuración `nginx.local.conf` incluye CORS headers para desarrollo
4. ✅ El `Dockerfile.local` construye sin optimizaciones de producción para builds más rápidos
5. ✅ Nunca uses `docker-compose.local.yml` en producción

---

## 📞 Soporte

Si tienes problemas, verifica:
- [ ] Backend local está corriendo en puerto 9090
- [ ] Docker Desktop está activo
- [ ] Puertos 4200 y 9090 no están ocupados
- [ ] Revisa los logs: `docker-compose -f docker-compose.local.yml logs`

---

¡Listo! Ahora puedes desarrollar localmente con Docker sin afectar producción. 🎉
