# Backups

Esta pasta armazena backups automáticos gerados pelos scripts de sincronização.

## Tipos de Backup

- `backup-local-*.sql` - Backup do banco local antes de sincronizar
- `rds-dump-*.sql` - Dump do RDS baixado
- `rds-backup-*.sql` - Backup do RDS antes de upload
- `local-dump-*.sql` - Dump local para upload

## Limpeza

Backups são mantidos indefinidamente. Limpe manualmente quando necessário:

```powershell
# Manter apenas últimos 10 backups
Get-ChildItem *.sql | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10 | Remove-Item
```
