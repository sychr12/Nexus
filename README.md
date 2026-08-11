
# SICPR - Sistema de Controle de Processos

Sistema completo com frontend em Next.js e backend em Spring Boot.

## 📦 Tecnologias

| Frontend | Backend |
|----------|---------|
| Next.js 15 | Java 17 |
| React 19 | Spring Boot |
| TypeScript | Spring Security |
| Tailwind CSS | PostgreSQL |
| - | JWT |

## 📁 Estrutura do Projeto

```
projeto/
├── frontend/          # Next.js (interface)
│   ├── app/
│   │   ├── login/     # Tela de login
│   │   ├── dashboard/ # Painel principal
│   │   └── services/  # Chamadas à API
│   └── public/
│
└── backend/           # Spring Boot (API)
    ├── auth/          # Login e JWT
    ├── user/          # CRUD usuários
    ├── config/        # CORS
    └── security/      # Configurações JWT
```

## 🚀 Como rodar

### Pré-requisitos

- Node.js
- Java 17
- PostgreSQL

### 1. Banco de Dados

```sql
CREATE DATABASE sistemacpp;
```

### 2. Backend (Spring Boot)

```bash
cd backend

# Configurar o banco em src/main/resources/application.properties
# spring.datasource.url=jdbc:postgresql://localhost:5432/sistemacpp
# spring.datasource.username=postgres
# spring.datasource.password=123456

# Executar
mvn spring-boot:run
```

O backend roda em `http://localhost:8080`

### 3. Frontend (Next.js)

```bash
cd frontend

# Instalar dependências
npm install

# Executar
npm run dev
```

O frontend roda em `http://localhost:3000`

## 🌐 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Autenticação (retorna token JWT) |
| GET | `/api/users` | Listar usuários |

### Exemplo de Login

```json
// POST /api/auth/login
{
  "email": "usuario@email.com"
}

// Resposta
{
  "token": "jwt_token_aqui"
}
```

## 🔐 Autenticação

O frontend envia o token JWT no header:
```
Authorization: Bearer token_aqui
```

## ▶️ Comandos úteis

| Frontend | Backend |
|----------|---------|
| `npm run dev` | `mvn spring-boot:run` |
| `npm run build` | `mvn clean install` |
| `npm run start` | - |

## 📝 Observações

- Login simplificado (não valida senha)
- Token JWT válido por 24 horas
- Frontend faz chamadas para o backend via serviços em `app/services/`

## 👨‍💻 Autor

Luiz
Beatriz
```
