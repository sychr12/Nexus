# SICPR - Sistema de Controle de Processos

Sistema organizacional para controle de processos, carteiras, memorandos, mensagens internas, fluxo operacional, auditoria e analises. O projeto e dividido em frontend Next.js e backend Spring Boot.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Java 17, Spring Boot 3, Spring Security |
| Banco | PostgreSQL com Flyway |
| Seguranca | JWT em cookie HttpOnly, CSRF, criptografia de dados sensiveis |
| Testes | Maven/Surefire, Spring Boot Test, H2 em modo PostgreSQL |

## Estrutura

```text
SICPR/
|-- backend/   # API Spring Boot
`-- frontend/  # Interface Next.js
```

## Requisitos

- Java 17
- Node.js 20 ou superior
- PostgreSQL
- Windows PowerShell ou Git Bash

## Configuracao Local

### 1. Banco

```sql
CREATE DATABASE sicpr;
```

### 2. Backend

```powershell
cd backend
Copy-Item .env.example .env
```

Edite `backend/.env` e ajuste `DB_PASSWORD`, `JWT_SECRET`, `DATA_ENCRYPTION_KEY`, `DATA_SEARCH_HASH_KEY` e, se quiser bootstrap local, `BOOTSTRAP_ADMIN_PASSWORD`.

Depois rode:

```powershell
.\mvnw.cmd spring-boot:run
```

O backend sobe em `http://localhost:8080`.

No Git Bash/MINGW, o comando equivalente e:

```bash
./mvnw spring-boot:run
```

Se a porta `8080` estiver ocupada, verifique e pare o processo local antes de rodar Maven:

```powershell
.\scripts\status-dev.cmd
.\scripts\stop-dev.cmd
```

No Git Bash/MINGW:

```bash
./scripts/status-dev.sh
./scripts/stop-dev.sh
```

### 3. Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

O frontend sobe em `http://localhost:3000`.

## Autenticacao

O login e feito em `POST /api/auth/login`. O backend grava o JWT em cookie HttpOnly (`SICPR_AUTH`), e o frontend envia requisicoes com `credentials: "include"`.

Para mutacoes (`POST`, `PUT`, `PATCH`, `DELETE`), o frontend busca o token CSRF em `GET /api/auth/csrf` e envia o header `X-XSRF-TOKEN`.

Nao use `Authorization: Bearer` no frontend atual.

## Comandos

| Tarefa | Comando |
|--------|---------|
| Testar backend | `cd backend; .\mvnw.cmd clean test` |
| Rodar backend | `cd backend; .\mvnw.cmd spring-boot:run` |
| Rodar backend no Git Bash | `cd backend; ./mvnw spring-boot:run` |
| Ver porta backend | `cd backend; .\scripts\status-dev.cmd` |
| Parar backend local preso | `cd backend; .\scripts\stop-dev.cmd` |
| Instalar frontend | `cd frontend; npm install` |
| Rodar frontend | `cd frontend; npm run dev` |
| Lint frontend | `cd frontend; npm run lint` |
| Build frontend | `cd frontend; npm run build` |

## CI

O workflow `.github/workflows/ci.yml` roda em push e pull request para `main`, `master` e `develop`.

- Backend: Java 17 + `./mvnw -B clean test`.
- Frontend: Node 20 + `npm ci`, `npm run lint` e `npm run build`.

## Qualidade

- O schema e controlado por Flyway.
- Hibernate usa `ddl-auto=validate`.
- Dados sensiveis sao criptografados no backend.
- Uploads possuem limites centralizados e validacao de tipo.
- Auditoria registra mutacoes relevantes.
- Healthcheck publico limitado a `/actuator/health`.
- A suite backend aplica migrations em H2 e valida a integracao principal.

## Documentacao Especifica

- Geral do sistema: [docs/SICPR_DOCUMENTACAO_GERAL.md](docs/SICPR_DOCUMENTACAO_GERAL.md)
- Backend: [backend/README.md](backend/README.md)
- Migrations: [backend/MIGRATIONS.md](backend/MIGRATIONS.md)
- Frontend: [frontend/README.md](frontend/README.md)
