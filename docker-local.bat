@echo off
REM Script para levantar Docker en modo LOCAL
REM Apunta al backend local en lugar de producción

echo ====================================
echo  Docker Local - Banking Portal
echo ====================================
echo.

REM Verificar que Docker Desktop esté corriendo
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop no esta corriendo
    echo Por favor, inicia Docker Desktop y vuelve a intentar
    pause
    exit /b 1
)

echo [OK] Docker Desktop esta activo
echo.

REM Verificar que el backend esté accesible
echo Verificando backend local en puerto 9090...
curl -s http://localhost:9090/spf-msa-client-core-service/actuator/health >nul 2>&1
if errorlevel 1 (
    echo [ADVERTENCIA] No se puede conectar al backend local
    echo Asegurate de que el backend este corriendo en puerto 9090
    echo.
    echo Puedes continuar de todas formas...
    pause
) else (
    echo [OK] Backend local accesible
    echo.
)

REM Construir y levantar con docker-compose
echo Construyendo y levantando contenedor...
echo.

docker-compose -f docker-compose.local.yml up --build

REM Si el usuario presiona Ctrl+C, detener los contenedores
docker-compose -f docker-compose.local.yml down
