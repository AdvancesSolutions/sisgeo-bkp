# PostgreSQL local no Windows (sem Docker)

Use esta opção se o Docker Desktop não estiver instalado ou não puder ser usado.

## 1. Instalar PostgreSQL

1. Baixe o instalador: https://www.postgresql.org/download/windows/
2. Execute o instalador e anote a **senha** que você definir para o usuário `postgres`.
3. Na instalação, deixe a porta **5432** e conclua.

## 2. Criar o banco e usuário do SIGEO

Abra **pgAdmin** ou o **psql** (Prompt do SQL no menu do PostgreSQL) e execute:

```sql
-- Se quiser usar usuário/senha específicos (opcional):
-- CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;
-- Ou use o usuário postgres já criado na instalação.

CREATE DATABASE sigeo;
```

Se o instalador já criou o usuário `postgres`, use a mesma senha que você definiu. O projeto espera por padrão:

- **Host:** localhost  
- **Porta:** 5432  
- **Usuário:** postgres  
- **Senha:** postgres  
- **Banco:** sigeo  

Se sua senha do `postgres` for outra, crie um arquivo `.env` na pasta da API (veja abaixo).

## 3. Variáveis de ambiente da API (opcional)

Na raiz do projeto ou em `apps/api`, crie ou edite `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=sigeo
```

Se não criar `.env`, a API usa os valores padrão (senha `postgres`). Ajuste `DB_PASSWORD` se tiver usado outra senha na instalação.

## 4. Subir a API

Com o PostgreSQL rodando e o banco `sigeo` criado:

```powershell
cd D:\SERVIDOR\SISGEO
pnpm dev:api
```

Na primeira vez, rode o seed (se existir):

```powershell
pnpm run db:seed
```

## Resumo

| Item        | Valor padrão |
|------------|----------------|
| Host       | localhost      |
| Porta      | 5432           |
| Usuário    | postgres       |
| Senha      | postgres       |
| Banco      | sigeo          |

Se o Docker estiver disponível, ainda assim é mais simples usar: `docker compose up -d postgres`.
