# Cadastro de currículos

Aplicação para **candidatos** enviarem currículo e para **RH** consultar inscrições. Com o servidor Node ativo, os dados gravam-se em **SQLite** (`data/curriculos.db`). O candidato pode ainda **descarregar JSON** (opcional), com PDF em Base64 se anexar ficheiro.

## Índice

Requisitos · execução · fluxo candidato/empresa · URLs · estrutura do código · funcionalidades · API HTTP · esquema SQLite · formato JSON · privacidade · resolução de problemas · evolução sugerida · Git/GitHub.

---
## Requisitos

- Navegador atual (Chrome, Edge, Firefox ou Safari).
- **Node.js 22.13 ou superior** (recomendado: **24.x**), com npm.
- O servidor usa o módulo integrado **`node:sqlite`** (SQLite embutido no Node). **Não** é necessário Python nem Visual C++ Build Tools para instalar dependências.

## Como executar (recomendado)

Na pasta do projeto:

```powershell
npm install
npm start
```

Na primeira execução bem-sucedida, o npm gera `package-lock.json` (pode versioná-lo no Git).

Abra no navegador:

- **Formulário (candidato):** [http://localhost:3000](http://localhost:3000) ou [http://localhost:3000/](http://localhost:3000/)
- **Painel RH (empresa):** [http://localhost:3000/painel.html](http://localhost:3000/painel.html)

A base de dados é criada em `data/curriculos.db` (pasta `data/` criada automaticamente; ficheiros `.db` estão no `.gitignore`).

**Porta:** por defeito `3000`. No Windows CMD: `set PORT=4000` e depois `npm start`.

**Aviso no terminal:** pode aparecer `ExperimentalWarning: SQLite is an experimental feature` — é esperado em versões recentes do Node; a aplicação funciona na mesma.

## Fluxo: candidato e empresa

| Quem | O quê | Onde |
|------|--------|------|
| **Candidato** | Preenche o formulário e clica **Salvar currículo** | `http://localhost:3000` |
| **Empresa / RH** | Vê lista e detalhe (e PDF, se houver) | `http://localhost:3000/painel.html` |
| **Integração / API** | Lista ou lê registo em JSON | `GET /api/curriculos` e `GET /api/curriculos/:id` |

## URLs rápidas

| URL | Descrição |
|-----|-----------|
| `/` | Formulário de cadastro |
| `/painel.html` | Painel de listagem e detalhe para RH |
| `/api/curriculos` | `GET` — lista resumida; `POST` — novo currículo (corpo JSON) |
| `/api/curriculos/:id` | `GET` — detalhe completo (`payload`) |

## Só front-end (sem base)

Se abrir `index.html` como ficheiro (`file://`), o envio **não** grava no SQLite; a página pede que use `npm start`. Continua disponível a opção **“Também baixar cópia em JSON”**.

## Estrutura do repositório

| Ficheiro / pasta | Descrição |
|------------------|-----------|
| `index.html` | Formulário e modelos HTML (formação e experiência repetíveis). |
| `styles.css` | Estilos partilhados (formulário e painel). |
| `app.js` | Validação, `POST` para API, JSON opcional. |
| `painel.html` + `painel.js` | Painel RH: tabela e detalhe do candidato. |
| `server.js` | Express, rotas API, `node:sqlite`, ficheiros estáticos. |
| `package.json` | Dependência principal: `express`. Scripts `npm start`. |
| `data/` | Base SQLite local (não versionada no Git). |

## Funcionalidades

- Dados pessoais: nome (obrigatório), data de nascimento, e-mail (obrigatório), telefone (obrigatório), cidade/UF, LinkedIn ou portfólio.
- Objetivo ou resumo profissional.
- **Formação:** vários blocos (curso, instituição, ano); adicionar/remover.
- **Experiência:** vários blocos (empresa, cargo, período, atividades); adicionar/remover.
- **Habilidades:** texto separado por vírgulas.
- **Anexo opcional:** PDF até **5 MB** (validação no cliente).
- **Gravação:** `POST /api/curriculos` persiste o payload completo em `payload_json`.
- **Painel RH:** lista todos os registos; **Ver currículo** mostra detalhe e link para descarregar PDF se existir.

> O painel **não tem autenticação** — adequado a desenvolvimento e rede interna. Para Internet, acrescente login, HTTPS e políticas de dados (LGPD).

## API HTTP (servidor local)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/api/curriculos` | Corpo: objeto JSON igual ao do formulário. `201` → `{ id, cadastradoEm }`. `400` → `{ erro }`. |
| `GET` | `/api/curriculos` | Lista: `id`, `cadastradoEm`, `nome`, `email`, `telefone` (mais recentes primeiro). |
| `GET` | `/api/curriculos/:id` | Detalhe com `payload` completo (mesmo formato que o JSON exportado). |

Limite do corpo JSON: **15 MB** (PDF em Base64).

## Esquema SQLite

Tabela `curriculos`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER PK | Autoincremento |
| `cadastrado_em` | TEXT | ISO 8601 |
| `nome`, `email`, `telefone` | TEXT | Cópia para listagens e índices |
| `payload_json` | TEXT | Objeto completo serializado (formação, experiência, anexo, etc.) |

## Formato do JSON exportado

O download (quando marcado) usa `JSON.stringify` e nome `curriculo_<nome>_<timestamp>.json`.

### Campos de nível superior

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cadastradoEm` | `string` | Data/hora ISO 8601. |
| `dadosPessoais` | `object` | Ver tabela abaixo. |
| `objetivo` | `string` | Resumo / cargo desejado. |
| `formacao` | `array` | Objetos de formação (vazios omitidos). |
| `experiencia` | `array` | Objetos de experiência (vazios omitidos). |
| `habilidades` | `array` | Strings (separadas por vírgula no formulário). |
| `anexo` | `object` ou `null` | PDF em Base64, se existir. |

### `dadosPessoais`

| Campo | Tipo |
|-------|------|
| `nome` | `string` |
| `dataNascimento` | `string` (`YYYY-MM-DD` ou vazio) |
| `email` | `string` |
| `telefone` | `string` |
| `localidade` | `string` |
| `linkedin` | `string` |

### Itens de `formacao`

| Campo | Tipo |
|-------|------|
| `curso` | `string` |
| `instituicao` | `string` |
| `anoConclusao` | `string` |

### Itens de `experiencia`

| Campo | Tipo |
|-------|------|
| `empresa` | `string` |
| `cargo` | `string` |
| `inicio` | `string` (`YYYY-MM`) |
| `fim` | `string` |
| `descricao` | `string` |

### `anexo` (quando há PDF)

| Campo | Tipo |
|-------|------|
| `nome` | `string` |
| `tipo` | `string` |
| `tamanhoBytes` | `number` |
| `conteudoBase64` | `string` |

## Privacidade e segurança

- O JSON e a base podem conter **dados pessoais** e **PDF em Base64**. Trate ficheiros exportados e cópias de `curriculos.db` como confidenciais.
- **Não** faça commit de `data/*.db` nem de JSON com dados reais de candidatos.
- Em produção: HTTPS, autenticação no painel, consentimento (LGPD) e, se possível, envio de PDF em `multipart/form-data` em vez de só Base64 em JSON.

## Resolução de problemas

| Situação | O que fazer |
|----------|-------------|
| `GET /api/curriculos` mostra `[]` | Normal se ainda ninguém gravou. Envie um currículo pela página inicial e atualize o painel ou a API. |
| Formulário diz que não liga ao servidor | Confirme `npm start` na pasta do projeto e use `http://localhost:3000` (não `file://`). |
| `npm install` falhou com pacotes nativos antigos | Este projeto **já não usa** `better-sqlite3`. Use Node ≥ 22.13, apague `node_modules` e volte a correr `npm install`. |
| Caminho no terminal Windows | Use `cd C:\Users\...\cadastro-curriculos` (com `cd` antes do caminho). |

## Próximos passos sugeridos

- Autenticação (sessão ou JWT) para `/painel.html` e eventualmente para `POST`.
- Alojamento com Node (Railway, Render, VPS) para uso na Internet; configurar `PORT` e cópias de segurança da base.
- Upload de PDF em `multipart/form-data` e armazenamento em disco ou object storage.
- Pesquisa e filtros no painel (por data, palavra-chave, etc.).

## Licença

O repositório pode incluir um ficheiro `LICENSE` do GitHub; ajuste conforme a sua organização.

## Git e GitHub

Na pasta do projeto (ajuste o caminho se a cópia local for outra):

```powershell
cd caminho\para\cadastro-curriculos
git status
git add index.html styles.css app.js painel.html painel.js server.js package.json README.md .gitignore
git commit -m "docs: README completo; formulário, API SQLite e painel RH"
git branch -M main
git push -u origin main
```

Se existir `package-lock.json` (após `npm install`), adicione-o ao commit: `git add package-lock.json`.

**Repositório remoto já configurado:** use `git remote -v`. Para alterar o URL:

```powershell
git remote set-url origin https://github.com/FabianoAM2025/CadastrodeCurrilulos.git
```

Identidade Git (se necessário):

```powershell
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"
```

### GitHub Pages (opcional)

O Pages **não** executa Node nem SQLite. Serve apenas HTML/CSS/JS estáticos: o formulário não gravaria na base. Para demo pública com base, use um serviço com Node.

---

**Resumo:** candidatos em `http://localhost:3000`; empresa em `http://localhost:3000/painel.html`; dados em `data/curriculos.db` com o servidor a correr.
