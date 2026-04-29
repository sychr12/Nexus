# 🚀 Backend - SICPR

API REST construída com **Spring Boot**, utilizando **PostgreSQL** e autenticação via **JWT**.

---

## 📌 Tecnologias

* Java 17
* Spring Boot
* Spring Security
* Spring Data JPA
* PostgreSQL
* JWT (jjwt)
* Maven

---

## 📂 Estrutura do Projeto

```id="y9q3bn"
backend/src/main/java/com/sicpr/backend
│
├── auth
│   ├── controller
│   │   └── AuthController.java
│   ├── dto
│   │   ├── AuthResponse.java
│   │   └── LoginRequest.java
│   └── service
│       └── AuthService.java
│
├── config
│   └── CorsConfig.java
│
├── security
│   ├── JwtService.java
│   └── SecurityConfig.java
│
├── user
│   ├── controller
│   │   └── UserController.java
│   ├── model
│   │   └── User.java
│   ├── repository
│   │   └── UserRepository.java
│   └── service
│       └── UserService.java
│
└── BackendApplication.java
```

---

## ⚙️ Configuração

Arquivo: `src/main/resources/application.properties`

```properties id="n3g3c3"
spring.application.name=backend

spring.datasource.url=jdbc:postgresql://localhost:5432/sistemacpp
spring.datasource.username=postgres
spring.datasource.password=123456

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

---

## 🛠️ Banco de Dados

Crie o banco no PostgreSQL:

```sql id="f7y5u2"
CREATE DATABASE sistemacpp;
```

---

## ▶️ Executar o Projeto

```bash id="q7jx0k"
cd backend
mvn spring-boot:run
```

---

## ⚠️ Ignorar testes (se necessário)

```bash id="c5h9pg"
mvn spring-boot:run -DskipTests
```

---

## 🌐 Endpoints

### 🔐 Login

**POST** `/api/auth/login`

#### Body:

```json id="3e0jru"
{
  "email": "teste@email.com"
}
```

#### Resposta:

```json id="6s3o2g"
{
  "token": "jwt_token"
}
```

---

### 👤 Usuários

**GET** `/api/users`

Retorna todos os usuários cadastrados.

---

## 🔐 Autenticação

* Utiliza JWT
* Token válido por 24 horas
* Gerado com base no email

---

## 📦 Build

```bash id="2jvt8b"
mvn clean install
```

---

## 🧠 Observações

* Login simplificado (não valida senha)
* Estrutura pronta para autenticação completa
* JWT já implementado e funcional
* Projeto organizado em camadas (Controller, Service, Repository)

---

## 🚀 Próximos Passos

* Implementar senha e autenticação real
* Proteger rotas com filtro JWT
* CRUD completo de usuários
* Integração com frontend (Next.js)

---

## 👨‍💻 Autor

Luiz
