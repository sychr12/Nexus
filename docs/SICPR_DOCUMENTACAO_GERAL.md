# SICPR - Documentacao geral do sistema

Este documento registra o estado funcional e organizacional atual do SICPR antes do commit de estabilizacao. Ele explica o objetivo do sistema, os perfis, as regras aplicadas, como backend e frontend respondem, a organizacao de pastas e os principais pontos ja implementados.

## 1. Objetivo do sistema

O SICPR e um sistema interno para controlar processos relacionados a produtores rurais, FAC, declaracoes, memorandos, analise, lancamento, consulta, carteira digital, relatorios, auditoria e mensagens internas.

O sistema atende dois contextos:

- IDAM Manaus, com administradores, gerentes e usuarios operacionais.
- Unidades locais externas do IDAM Amazonas, com gerentes e tecnicos vinculados a uma unidade local.

O sistema nao deve depender de e-mail para funcionamento. As comunicacoes internas ficam no modulo de mensagens do proprio sistema.

## 2. Perfis oficiais

Existem somente quatro perfis:

| Perfil tecnico | Nome no sistema | Escopo |
| --- | --- | --- |
| `ADMIN` | Administrador | Acesso total ao sistema |
| `GERENTE` | Gerente | Acesso gerencial filtrado pela unidade local |
| `TECNICO` | Tecnico | Cadastro e consulta operacional da unidade local |
| `USUARIO` | Usuario | Rotinas operacionais liberadas para usuarios do sistema |


## 3. Regras de acesso por perfil

### ADMIN

O administrador pode acessar e editar tudo:

- Dashboard
- Relatorios
- Unidade Local
- Gerente de Unidade Local
- Central de Memorandos
- Memorando de Saida
- Carteira Digital
- Consultar
- Analises
- Lancamentos
- Mensagens
- Gerenciamento de Usuarios
- Auditoria
- Perfil

O `ADMIN` e o unico perfil com acesso global real no backend.

### GERENTE

O gerente acessa:

- Dashboard
- Relatorios
- Consultar
- Gerente de Unidade Local
- Central de Memorandos
- Perfil

Todas as informacoes do gerente devem ser filtradas pela unidade local vinculada ao usuario.

O gerente nao acessa a aba Unidade Local, Analises, Lancamentos, Carteira Digital, Gerenciamento de Usuarios ou Auditoria.

### TECNICO

O tecnico acessa:

- Unidade Local
- Consultar
- Mensagens
- Perfil

O tecnico fica vinculado a uma unidade local. Consultas e processos devem respeitar essa unidade.

### USUARIO

O usuario acessa:

- Unidade Local
- Carteira Digital
- Consultar
- Analises
- Lancamentos
- Mensagens
- Perfil

O usuario nao tem acesso global ao fluxo. Ele tambem fica limitado a unidade local vinculada, exceto nas areas onde a regra de negocio explicitamente permitir outra coisa.

## 4. Regras importantes ja aplicadas

### 4.1 Remocao completa do modulo de e-mail

O modulo de e-mail foi removido/desativado porque o sistema opera via interface interna.

Foi removido:

- Pacote backend de e-mail.
- Endpoint `/api/email/**`.
- Dependencia `spring-boot-starter-mail`.
- Referencias de auditoria para e-mail.
- Filtro "E-mail/anexos" na auditoria.
- Tabela `emails_anexos` da migration inicial.

Foi criada migration de limpeza:

- `V9__drop_email_module.sql`

Essa migration remove `emails_anexos` em bancos que ja tinham a tabela.

### 4.2 Permissao global do fluxo

Antes, `USUARIO` era tratado como acesso global em parte do fluxo. Isso foi corrigido.

Agora:

- Somente `ADMIN` possui acesso global.
- `GERENTE`, `TECNICO` e `USUARIO` dependem de unidade local.
- Acoes de analise e lancamento validam acesso ao processo antes de aprovar, devolver ou concluir.

### 4.3 Consulta

A rota web de consulta (`/api/inscricoes/web`) e acessivel por:

- `ADMIN`
- `GERENTE`
- `TECNICO`
- `USUARIO`

Para nao-admin, a consulta e filtrada por unidade local.

### 4.4 Relatorios

Relatorios sao acessiveis por:

- `ADMIN`
- `GERENTE`

No backend:

- `ADMIN` pode consultar todas as unidades ou uma unidade especifica.
- `GERENTE` sempre fica limitado a propria unidade local.

Mesmo que o frontend seja manipulado, o backend impede gerente de obter dados globais.

### 4.5 Central de Memorandos

A Central de Memorandos deixou de ser derivada no frontend.

Agora existe endpoint backend proprio:

```text
GET /api/central-memorandos
```

Recursos atuais:

- Paginacao: `page`, `size`
- Filtro por status: `status`
- Busca textual: `search`
- Contadores por status
- Escopo por perfil
- Auditoria da consulta

Acesso:

- `ADMIN`: todas as unidades
- `GERENTE`: somente a unidade local vinculada
- `TECNICO`: sem acesso
- `USUARIO`: sem acesso

O frontend da pagina `/memorandos-assinados` agora consome a API da Central e nao usa mais `fluxoApi.listarProcessos()` para montar memorandos localmente.

### 4.6 Mensagens internas

Mensagens sao acessiveis por:

- `ADMIN`
- `TECNICO`
- `USUARIO`

Foi criada rota segura para contatos:

```text
GET /api/mensagens/usuarios
```

Essa rota retorna apenas dados minimos de usuarios ativos, sem liberar o gerenciamento completo de usuarios para perfis nao administrativos.

### 4.7 Auditoria

A auditoria registra acoes relevantes e eventos de mutacao.

Atualmente:

- Apenas `ADMIN` acessa a aba Auditoria.
- A Central de Memorandos registra consulta institucional.
- A tela de auditoria possui guia de codigos HTTP.
- Mutacoes relevantes sao resolvidas pelo `AuditActionResolver`.

Codigos comuns:

- `200`: sucesso com resposta
- `201`: registro criado
- `204`: sucesso sem conteudo
- `400`: dados invalidos
- `401`: login necessario
- `403`: sem permissao
- `404`: registro/rota nao encontrada

### 4.8 Perfil e senha

A aba Perfil mostra:

- Usuario autenticado
- Perfil
- Unidade/escopo
- Areas liberadas para aquele perfil
- Botao para alterar senha

A aba separada "Senha" nao fica como menu principal, mas a rota ainda pode existir para acesso a partir do perfil.

### 4.9 Recuperacao de senha

O sistema usa codigo temporario no formato amigavel, por exemplo:

```text
IDAM-123456
```

Regras aplicadas:

- Codigo temporario expira em 10 minutos.
- Modal mostra contador regressivo.
- Codigo e de uso unico.
- Se a janela for fechada, o codigo vigente deve ser reaproveitado ate expirar, em vez de gerar outro desnecessariamente.

## 5. Fluxo operacional principal

### 5.1 Unidade Local

A Unidade Local e onde o processo nasce.

Etapas principais:

1. Usuario/tecnico informa dados iniciais.
2. FAC e Declaracao sao preenchidas com os dados do processo.
3. FAC deve seguir o layout oficial do documento.
4. Datas usam formato `dd/mm/aaaa`.
5. Latitude e longitude possuem validacao e visualizacao por mapa externo quando aplicavel.
6. Documentos obrigatorios devem ser anexados quando exigidos.
7. Processo e encaminhado ao gerente.

### 5.2 Gerente

O gerente recebe processos da propria unidade local.

Ele pode:

- Ver processos encaminhados para decisao.
- Aprovar lote.
- Gerar memorando de lote.
- Assinar eletronicamente dentro do sistema.
- Devolver processo com justificativa.

### 5.3 Analises

Analises sao acessiveis por `ADMIN` e `USUARIO`.

Regras:

- O processo so entra em analise apos aprovacao/assinatura do gerente.
- Usuario nao-admin so pode atuar em processos da propria unidade local.
- A analise pode aprovar ou devolver.

### 5.4 Lancamentos

Lancamentos sao acessiveis por `ADMIN` e `USUARIO`.

Regras:

- O processo so pode ser concluido se estiver aprovado para lancamento.
- Ao concluir lancamento, o produtor/processo pode ser publicado para Consulta.
- A conclusao tambem registra historico.
- Ainda precisa da API SEFAZ

### 5.5 Consulta

Consulta mostra registros publicados/concluidos conforme permissao.

- `ADMIN`: visao geral.
- `TECNICO` e `USUARIO`: filtrado pela unidade local.

## 6. Backend

O backend usa Java 17, Spring Boot 3, Spring Security, JPA/Hibernate, Flyway e PostgreSQL.

### 6.1 Organizacao principal

```text
backend/src/main/java/com/sicpr/backend/
|-- analise/       # Analises e encaminhamentos
|-- audit/         # Auditoria do sistema
|-- auth/          # Login, sessao, logout e recuperacao de senha
|-- carteira/      # Carteira digital
|-- config/        # Configuracoes gerais, seguranca, CORS, upload
|-- dashboard/     # Indicadores e atividades recentes
|-- fluxo/         # Fluxo operacional SICPR
|-- inscricao/     # Inscricoes publicadas/consulta
|-- memorando/     # Memorandos e Central de Memorandos
|-- mensagem/      # Mensagens internas
|-- relatorio/     # Relatorios gerenciais
|-- security/      # JWT, usuario atual, criptografia, roles
|-- user/          # Usuarios e bootstrap
```

### 6.2 Camadas backend

Padrao predominante:

```text
Controller -> Service -> Repository -> Entity
```

Responsabilidades:

- `Controller`: recebe HTTP, valida parametros basicos e chama service.
- `Service`: aplica regra de negocio, permissao, transicao de status e auditoria direta quando necessario.
- `Repository`: acesso ao banco.
- `DTO`: entrada e saida das APIs.
- `Mapper`: converte entidade para DTO.

### 6.3 Seguranca backend

Principais pontos:

- Login gera JWT em cookie HttpOnly.
- Mutacoes usam CSRF.
- Rotas protegidas por perfil em `SecurityConfig`.
- `RoleUtils` normaliza perfis.
- `CurrentUserService` recupera usuario autenticado.
- Dados sensiveis usam criptografia.
- CPF possui hash pesquisavel.
- Uploads possuem validacao de tamanho e tipo.

### 6.4 Banco e migrations

O schema e controlado por Flyway:

```text
backend/src/main/resources/db/migration/
```

Estado atual importante:

- `V1__create_initial_schema.sql`: schema inicial.
- `V2`: hashes pesquisaveis.
- `V3`: auditoria.
- `V5`: unidade local no usuario.
- `V6`: tokens temporarios de senha.
- `V7`: consolidacao de carteira e indices.
- `V8`: liga fluxo concluido a inscricoes.
- `V9`: remove modulo/tabela de e-mail.

O Hibernate usa validacao de schema, nao criacao automatica livre.

## 7. Frontend

O frontend usa Next.js 16, React 19, TypeScript e Tailwind.

### 7.1 Organizacao principal

```text
frontend/app/
|-- (pages)/       # Rotas/telas do sistema
|-- _components/   # Componentes compartilhados
|-- _features/     # Funcionalidades compartilhadas por dominio
|-- _hooks/        # Hooks reutilizaveis
|-- _lib/          # Utilitarios, HTTP, auth, access-control
```

### 7.2 Sobre a pasta `(pages)`

No Next.js, pastas entre parenteses sao route groups.

Isso significa:

- `(pages)` organiza o codigo.
- `(pages)` nao aparece na URL.
- Nem tudo dentro de `(pages)` precisa ser uma aba da sidebar.

Exemplos:

| Pasta | URL | Nome no menu |
| --- | --- | --- |
| `dashboard` | `/dashboard` | Dashboard / KPIs |
| `relatorios` | `/relatorios` | Relatorios |
| `unloc` | `/unloc` | Unidade Local |
| `gerente` | `/gerente` | Gerente de Unidade Local |
| `memorandos-assinados` | `/memorandos-assinados` | Central de Memorandos |
| `memorando` | `/memorando` | Memorando de Saida |
| `carteira` | `/carteira` | Carteira Digital |
| `tabela` | `/tabela` | Consultar |
| `analises` | `/analises` | Analises |
| `lancamentos` | `/lancamentos` | Lancamentos |
| `mensagens` | `/mensagens` | Mensagens |
| `users` | `/users` | Gerenciamento de Usuarios |
| `auditoria` | `/auditoria` | Auditoria |
| `perfil` | `/perfil` | Perfil |

Rotas como `senha`, `recuperar-senha`, `carteira/adicionar` e outras podem existir sem serem abas principais.

### 7.3 Controle de acesso no frontend

Arquivo principal:

```text
frontend/app/_lib/access-control.ts
```

Ele define:

- Perfis oficiais.
- Nome exibido de cada perfil.
- Abas liberadas por perfil.
- Descricoes de acesso.

As paginas usam:

```text
useAuthSession({ allowedRoles: [...] })
```

Isso protege a navegacao no frontend. Mesmo assim, a protecao real precisa existir tambem no backend, porque o frontend pode ser manipulado.

### 7.4 Sidebar

Arquivo:

```text
frontend/app/_components/layout/Sidebar.tsx
```

A Sidebar:

- Busca o perfil da sessao.
- Normaliza o perfil.
- Mostra somente os itens permitidos em `MENU_ACCESS`.
- Sempre inclui Perfil.

### 7.5 Cliente HTTP

Arquivo:

```text
frontend/app/_lib/http.ts
```

Responsabilidades:

- Montar URL base da API.
- Enviar cookies com `credentials: "include"`.
- Buscar CSRF em mutacoes.
- Serializar JSON.
- Ler mensagens de erro do backend.

O frontend atual nao deve usar `Authorization: Bearer` como padrao. A autenticacao principal e por cookie HttpOnly.

## 8. Como o sistema responde a uma acao

Fluxo geral:

```text
Usuario clica na tela
-> Pagina React chama service/api do frontend
-> apiJson/apiFetch envia request com cookie e CSRF quando necessario
-> Spring Security valida sessao, CSRF e perfil
-> Controller recebe request
-> Service aplica regra de negocio e escopo da unidade local
-> Repository consulta/altera banco
-> Service monta resposta DTO
-> Controller retorna JSON
-> Frontend atualiza estado/tabela/modal
-> Auditoria registra mutacoes e consultas relevantes
```

Exemplo: Central de Memorandos:

```text
/memorandos-assinados
-> centralMemorandosService.listar()
-> GET /api/central-memorandos
-> SecurityConfig permite ADMIN/GERENTE
-> MemorandoCentralService filtra por unidade se for GERENTE
-> API retorna items, total, page, totalPages, statusCounts
-> Tela renderiza tabela, filtros e modal de detalhes
```

Exemplo: Lancamento concluido:

```text
/lancamentos
-> POST /api/fluxo/processos/{id}/lancamento/concluir
-> backend valida perfil ADMIN/USUARIO
-> backend valida unidade local do processo
-> backend valida status aprovado_lancamento
-> muda situacao para concluido
-> publica inscricao/consulta quando aplicavel
-> registra historico
```

## 9. Documentos e PDFs

O sistema possui visualizadores internos para documentos gerados.

Melhorias ja aplicadas:

- Modal com zoom.
- Tela cheia com botao de sair.
- Scroll interno no documento.
- Ajustes para FAC e declaracao.
- Papel timbrado em documentos aplicaveis.
- Relatorios gerenciais em pre-visualizacao antes de salvar PDF.

Observacao: documentos oficiais, como FAC e declaracao, precisam manter fidelidade visual ao modelo do governo.

## 10. Pontos que ainda merecem revisao futura

Antes da entrega final ou implantacao real, ainda e bom revisar:

- Se todos os campos da FAC e Declaracao estao 100% aderentes ao modelo oficial.
- Integracao real com PostgreSQL/pgAdmin em ambiente de homologacao.
- Dados reais de unidades locais e gerentes.
- Regras finais sobre assinatura eletronica de tecnicos e gerentes.
- Melhorias de performance em consultas grandes.
- Politica de backup e restauracao.
- Logs e auditoria em ambiente de producao.
- Padronizacao visual fina em todas as telas.
- Eventual renomeacao tecnica futura de `USUARIO`, se o dominio exigir outro nome interno.

## 11. Comandos de validacao

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Antes de commitar:

```powershell
git status
git diff --stat
```

Nao commitar:

- `.env`
- `.env.local`
- logs
- arquivos temporarios
- `target/`
- `.next/`
- `node_modules/`

## 12. Resumo do estado atual

O sistema esta mais seguro e mais organizacional que no inicio:

- Perfis foram padronizados.
- `USUARIO` nao possui mais acesso global.
- Gerente fica filtrado pela unidade local.
- Central de Memorandos virou endpoint backend institucional.
- Modulo de e-mail foi removido.
- Auditoria foi melhorada.
- Relatorios foram protegidos por escopo.
- Frontend possui guards por pagina e menu por permissao.
- Backend possui regras reais de seguranca nas APIs.

Este documento deve ser atualizado sempre que uma nova regra de permissao, fluxo ou modulo estrutural for alterado.
