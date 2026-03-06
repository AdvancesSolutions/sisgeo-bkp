@echo off
REM Script para iniciar os serviços em produção
REM Execute como administrador para melhor funcionamento

echo.
echo ============================================
echo   SISGEO - Deploy em Produção (Local)
echo ============================================
echo.

echo [*] Matando processos Node anteriores...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak

echo [*] Iniciando PM2...
call npx pm2 kill
call npx pm2 start ecosystem.config.js
call npx pm2 save

echo.
echo [✓] Serviços iniciados com sucesso!
echo.
echo URLs:
echo   - API:      http://localhost:3001
echo   - Frontend: http://localhost:3000
echo   - Health:   http://localhost:3001/health
echo.
echo Comandos úteis:
echo   - Ver status:   npx pm2 list
echo   - Ver logs:     npx pm2 logs
echo   - Parar:        npx pm2 stop all
echo   - Restart:      npx pm2 restart all
echo   - Delete:       npx pm2 delete all
echo.
pause
