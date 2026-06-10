
# Backend - SICPR

API REST com Spring Boot, PostgreSQL e autenticação JWT.

## 🚀 Como rodar

### 1. Criar o banco de dados

```sql
CREATE DATABASE sistemacpp;
```

### 2. Configurar o acesso

Edite `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/sicpr
spring.datasource.username=postgres
spring.datasource.password=123456
```

### 3. Executar

```bash
mvn spring-boot:run
```

## 📁 Estrutura

```
backend/
├── auth/           # Login e autenticação
├── user/           # Usuários (CRUD)
├── config/         # Configurações (CORS)
└── security/       # JWT
```

## 🌐 Endpoints

| Método | Endpoint | O que faz |
|--------|----------|-----------|
| POST | `/api/auth/login` | Faz login e retorna token JWT |
| GET | `/api/users` | Lista todos os usuários |

### Login - Exemplo

**Requisição:**
```json
{
  "email": "teste@email.com"
}
```

**Resposta:**
```json
{
  "token": "jwt_token_aqui"
}
```

## 🔐 Autenticação

- Token JWT válido por 24 horas
- Para acessar rotas protegidas, envie o token no header:
```
Authorization: Bearer jwt_token_aqui
```

## 🛠️ Tecnologias

- Java 17
- Spring Boot
- Spring Security
- PostgreSQL
- JWT
- Maven

## 📦 Build para produção

```bash
mvn clean install
```

## ⚠️ Observação

O login atual é simplificado (não valida senha). Apenas o email é necessário.

---

**Autor:** Luiz
```