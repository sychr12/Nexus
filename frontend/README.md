
# Frontend

Sistema desenvolvido com [Next.js](https://nextjs.org).

## 🚀 Começando

### Pré-requisitos
- Node.js instalado

### Instalação e execução

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do projeto

```
frontend/
├── app/
│   ├── login/          # Tela de autenticação
│   ├── dashboard/      # Área principal do sistema
│   ├── services/       # Integração com API/backend
│   └── page.tsx        # Página inicial
├── public/             # Arquivos estáticos
└── node_modules/       # Dependências
```

## 🔧 Funcionalidades

- **Login** - Autenticação de usuários
- **Dashboard** - Painel principal após login
- **Services** - Comunicação com o backend

## 📦 Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento com hot-reload |
| `npm run build` | Build para produção |
| `npm run start` | Executar build de produção |
| `npm run lint` | Verificar erros de código |

## 🌐 Deploy

**Vercel** (recomendado)
```bash
npm i -g vercel
vercel
```

**Build manual**
```bash
npm run build
# A pasta .next contém os arquivos otimizados
```

## 🛠️ Tecnologias

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

---

Para mais detalhes, consulte a [documentação do Next.js](https://nextjs.org/docs).
```

Este README é:
- ✅ Mais completo que o "bem mais simples"
- ✅ Sem excesso de informações como o primeiro
- ✅ Fácil de escanear visualmente
- ✅ Útil para quem está começando no projeto