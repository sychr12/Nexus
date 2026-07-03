# Backend - SICPR

API Spring Boot do SICPR, com PostgreSQL, Flyway, autenticacao por cookie HttpOnly, CSRF, auditoria e criptografia de dados sensiveis.

## Requisitos

- Java 17
- PostgreSQL
- Maven Wrapper (`mvnw.cmd` no Windows)

## Configuracao Local

1. Crie o banco:

```sql
CREATE DATABASE sicpr;
```

2. Crie o arquivo local de ambiente:

```powershell
Copy-Item .env.example .env
```

3. Edite `.env` e troque todos os valores `change-me-*`.

Importante: depois que houver dados gravados, mantenha `DATA_ENCRYPTION_KEY` e `DATA_SEARCH_HASH_KEY` estaveis. Trocar essas chaves sem uma rotina de rotacao torna dados criptografados existentes ilegiveis.

O arquivo `.env` e carregado automaticamente pelo perfil `dev` e nao deve ser versionado.

## Execucao Local

O caminho padrao do projeto e o Maven Wrapper:

```powershell
.\mvnw.cmd spring-boot:run
```

No Git Bash/MINGW:

```bash
./mvnw spring-boot:run
```

O backend roda em `http://localhost:8080`.

Se a porta `8080` ja estiver em uso, pare a instancia local antes de rodar Maven novamente:

```powershell
.\scripts\status-dev.cmd
.\scripts\stop-dev.cmd
```

No Git Bash:

```bash
./scripts/status-dev.sh
./scripts/stop-dev.sh
```

## Testes

```powershell
.\mvnw.cmd clean test
```

A suite de integracao usa H2 em modo PostgreSQL, aplica as migrations Flyway e valida o mapeamento JPA.

No CI, o backend roda com Java 17 e executa:

```bash
./mvnw -B clean test
```

## Healthcheck

O backend expoe apenas o endpoint publico de saude:

```text
GET /actuator/health
```

Detalhes internos, metricas e outros endpoints Actuator nao ficam expostos por padrao.

## Autenticacao

- Login: `POST /api/auth/login`
- Sessao: `GET /api/auth/session`
- CSRF: `GET /api/auth/csrf`
- Logout: `POST /api/auth/logout`

O token JWT fica em cookie HttpOnly (`SICPR_AUTH`). O frontend envia o token CSRF por `X-XSRF-TOKEN` para metodos de mutacao.

## Bootstrap Admin

O admin automatico e desabilitado por padrao. Para desenvolvimento local, configure no `.env`:

```properties
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=ChangeMe@123
BOOTSTRAP_ADMIN_RESET_PASSWORD=false
```

Nunca habilite bootstrap admin em producao sem um fluxo operacional controlado.

## Bootstrap de Usuarios de Unidade

Para criar usuarios iniciais de gerente, tecnico ou carteira sem expor cadastro na tela operacional, use:

```properties
BOOTSTRAP_USERS_ENABLED=true
BOOTSTRAP_USERS_ENTRIES=gerente_manacapuru|ChangeMe@123|Gerente Manacapuru|GERENTE|Manacapuru
```

O formato e `username|senha|nomeCompleto|perfil|unidadeLocal`, separando varios usuarios por `;`. O bootstrap cria apenas usuarios inexistentes, valida a politica de senha e deve ficar desligado apos o preparo do ambiente.

## Validacao de Producao

Com o profile `prod`, o backend falha no startup se detectar configuracao insegura:

- `JWT_SECRET`, `DATA_ENCRYPTION_KEY` ou `DATA_SEARCH_HASH_KEY` fracos/default.
- `DATA_SEARCH_HASH_KEY` igual a `DATA_ENCRYPTION_KEY`.
- `AUTH_COOKIE_SECURE=false`.
- `ALLOWED_ORIGINS` com wildcard ou `localhost`.
- Bootstrap admin ou reset de senha bootstrap habilitado.
- JPA fora de `validate` ou Flyway desabilitado.

## Migracoes

As regras de schema ficam em [MIGRATIONS.md](MIGRATIONS.md).
