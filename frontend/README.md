# Frontend - SICPR

Interface web do SICPR, desenvolvida com Next.js App Router, React, TypeScript e Tailwind CSS.

## Requisitos

- Node.js 20 ou superior
- Backend rodando em `http://localhost:8080`

## Configuracao Local

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Por padrao, o frontend usa:

```properties
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor local de desenvolvimento |
| `npm run lint` | Verificacao ESLint |
| `npm run build` | Build de producao |
| `npm run start` | Executa o build gerado |

## Integracao com Backend

As chamadas HTTP passam por `app/_lib/http.ts`.

- `API_BASE_URL` vem de `NEXT_PUBLIC_API_URL`.
- Cookies sao enviados com `credentials: "include"`.
- O JWT fica em cookie HttpOnly criado pelo backend.
- Mutacoes recebem automaticamente o header `X-XSRF-TOKEN`.

O frontend nao manipula JWT manualmente e nao deve persistir token em `localStorage`.

## Organizacao

```text
frontend/app/
├── (pages)/       # rotas visiveis da aplicacao
├── _components/   # componentes compartilhados
├── _features/     # logica e UI por dominio
├── _hooks/        # hooks reutilizaveis
├── _lib/          # HTTP, auth e utilitarios comuns
└── _services/     # adaptadores legados/globais
```

Detalhes adicionais: [app/README.md](app/README.md).

## Validacao Antes de Entregar

```powershell
npm run lint
npm run build
```

No CI, o frontend roda com Node 20 e executa `npm ci`, `npm run lint` e `npm run build`.
