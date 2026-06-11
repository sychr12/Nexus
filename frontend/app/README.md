# Organizacao do app

Esta pasta usa o App Router do Next.js. Para manter as paginas separadas do codigo compartilhado:

- `(pages)/`: telas que viram URLs da aplicacao. O grupo entre parenteses nao aparece na URL.
- `_components/`: componentes compartilhados entre mais de uma tela.
- `_components/layout/`: componentes estruturais, como `Sidebar`.
- `_features/`: regras e UI compartilhadas de um dominio especifico, sem virar rota.
- `_hooks/`: hooks reutilizaveis.
- `_lib/`: infraestrutura comum, como autenticacao, HTTP e dados base.
- `_services/`: servicos globais ou adaptadores legados.

Dentro de cada pagina, mantenha junto dela o que for exclusivo daquela tela:

- `components/`
- `services/`
- `types/`
- `lib/`

Prefira imports por alias para codigo compartilhado, por exemplo:

```ts
import { apiJson } from "@/app/_lib/http";
import Sidebar from "@/app/_components/layout/Sidebar";
```

Para arquivos internos da propria rota, imports relativos continuam bons:

```ts
import UserTable from "./components/UserTable";
```
