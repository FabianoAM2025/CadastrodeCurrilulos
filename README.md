# Cadastro de currículos

Formulário web **estático** (HTML, CSS e JavaScript) para cadastro de currículo no navegador. Não há servidor nem banco de dados: ao enviar, os dados são reunidos e **baixados como um arquivo JSON** (e o PDF opcional é embutido em Base64).

## Requisitos

- Navegador atual (Chrome, Edge, Firefox ou Safari).
- Nenhuma instalação de Node ou outra ferramenta é obrigatória para uso local.

## Como abrir o projeto

1. Clone ou baixe esta pasta.
2. Abra o arquivo `index.html` no navegador (duplo clique ou arrastar o arquivo para uma janela do navegador).

Para testar com URLs “limpas” ou evitar restrições de alguns recursos, você pode servir a pasta com qualquer servidor estático, por exemplo:

```powershell
# Se tiver Python 3 instalado, na pasta do projeto:
python -m http.server 8080
```

Depois acesse `http://localhost:8080` no navegador.

## Estrutura do repositório

| Arquivo       | Descrição |
|---------------|-----------|
| `index.html`  | Página, formulário e modelos HTML para blocos repetíveis (formação e experiência). |
| `styles.css`  | Estilos e layout responsivo. |
| `app.js`      | Validação, blocos dinâmicos, leitura do PDF e geração do download JSON. |

## Funcionalidades

- Dados pessoais: nome (obrigatório), data de nascimento, e-mail (obrigatório), telefone (obrigatório), cidade/UF, LinkedIn ou portfólio.
- Objetivo ou resumo profissional (texto livre).
- **Formação**: vários registros (curso, instituição, ano de conclusão); botões para adicionar e remover.
- **Experiência**: vários registros (empresa, cargo, início/fim em mês, descrição das atividades); adicionar e remover.
- **Habilidades**: lista em um único campo, separada por vírgulas.
- **Anexo opcional**: PDF até **5 MB**; o nome e o tamanho são validados no cliente.

## Formato do JSON exportado

O envio do formulário gera um objeto serializado com `JSON.stringify` e dispara o download de um arquivo com nome no padrão `curriculo_<nome>_<timestamp>.json`.

### Campos de nível superior

| Campo           | Tipo     | Descrição |
|-----------------|----------|-------------|
| `cadastradoEm`  | `string` | Data/hora ISO 8601 do momento do envio. |
| `dadosPessoais` | `object` | Ver tabela abaixo. |
| `objetivo`      | `string` | Texto do campo objetivo/resumo. |
| `formacao`      | `array`  | Lista de objetos de formação (entradas vazias são omitidas). |
| `experiencia`   | `array`  | Lista de objetos de experiência (entradas vazias são omitidas). |
| `habilidades`   | `array`  | Lista de strings (itens após separar por vírgula e remover espaços). |
| `anexo`         | `object` ou `null` | Metadados e conteúdo do PDF, se houver arquivo; caso contrário `null`. |

### `dadosPessoais`

| Campo            | Tipo     |
|------------------|----------|
| `nome`           | `string` |
| `dataNascimento` | `string` (formato `YYYY-MM-DD` do input `date`, ou vazio) |
| `email`          | `string` |
| `telefone`       | `string` |
| `localidade`     | `string` |
| `linkedin`       | `string` |

### Itens de `formacao`

| Campo          | Tipo     |
|----------------|----------|
| `curso`        | `string` |
| `instituicao`  | `string` |
| `anoConclusao` | `string` (valor numérico do campo ano, como texto) |

### Itens de `experiencia`

| Campo       | Tipo     |
|-------------|----------|
| `empresa`   | `string` |
| `cargo`     | `string` |
| `inicio`    | `string` (formato `YYYY-MM` do input `month`, ou vazio) |
| `fim`       | `string` (idem; vazio se “atual”) |
| `descricao` | `string` |

### `anexo` (quando há PDF)

| Campo              | Tipo     | Descrição |
|--------------------|----------|-----------|
| `nome`             | `string` | Nome original do arquivo. |
| `tipo`             | `string` | MIME type (ex.: `application/pdf`). |
| `tamanhoBytes`     | `number` | Tamanho em bytes. |
| `conteudoBase64`   | `string` | Conteúdo binário do PDF codificado em Base64 (sem prefixo `data:...`). |

## Privacidade e segurança

- O JSON pode conter **dados pessoais** e o **PDF completo em Base64**. Trate o arquivo como confidencial.
- **Não** commite no Git arquivos JSON exportados com dados reais de pessoas.
- Em produção, prefira enviar o PDF com `multipart/form-data` para um servidor que aplique políticas de retenção e consentimento (LGPD), em vez de distribuir JSON com Base64 por e-mail ou repositório público.

## Próximos passos sugeridos

- Backend (API) para receber `POST` e gravar em banco ou armazenamento de objetos.
- Autenticação para área de RH e painel de listagem.
- Hospedagem estática (GitHub Pages, Netlify, Vercel) apenas para o front-end, com a API em outro serviço.

## Licença

Este repositório não define licença por padrão. Adicione um arquivo `LICENSE` se quiser distribuir o código com termos claros.

## Publicar no GitHub

Na pasta do projeto, após criar um repositório vazio no GitHub (sem README gerado pelo site, se você já tem estes arquivos localmente):

```powershell
cd "C:\Users\fabia\.cursor\projects\empty-window\cadastro-curriculos"
git init
git add index.html styles.css app.js README.md .gitignore
git commit -m "feat: formulário estático de cadastro de currículo com exportação JSON"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelos valores do seu GitHub. Se o Git pedir identidade na primeira vez:

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Ou use apenas neste repositório (sem `--global`).

### GitHub Pages (opcional)

No repositório: **Settings → Pages → Build and deployment → Branch `main` e pasta `/ (root)`**. O site ficará em `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/` (o nome exato depende da configuração do repositório).
