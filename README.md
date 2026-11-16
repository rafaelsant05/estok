# Estok

Aplicativo mobile de **controle de estoque para MEI** (Microempreendedor Individual), desenvolvido em **React Native com Expo** e **Firebase** como projeto final da disciplina de Desenvolvimento Mobile.

## O problema

Muitos MEIs ainda controlam o estoque em caderno ou de cabeça. Sem um controle confiável, descobrem que um produto acabou só quando o cliente pede, e perdem a venda.

O **Estok** permite cadastrar produtos, registrar entradas e saídas, receber o alerta de estoque baixo e localizar um produto pelo código de barras, tudo pelo celular.

- **Público-alvo:** microempreendedores individuais e pequenos comércios.
- **Escopo:** somente estoque. O app não trata de vendas, preços, lucro ou margem.

## Funcionalidades

- [x] Cadastro e login de usuários (Firebase Authentication), com validação dos campos
- [x] Cada usuário enxerga apenas os próprios dados
- [x] Navegação com Stack e Bottom Tabs (Início, Produtos, Movimentações e Configurações)
- [x] Lista de produtos com busca por nome e filtro por categoria, com destaque para estoque baixo
- [x] Cadastro e edição de produtos com validação
- [x] Entradas e saídas de estoque, com histórico e filtro por tipo
- [x] Saída maior que o estoque é recusada (registro feito em transação do Firestore)
- [x] Tela inicial com resumo (total de produtos e de itens) e lista de produtos com estoque baixo
- [x] Leitura de código de barras com a câmera, com campo para digitar o código manualmente
- [x] Notificação local de estoque baixo
- [x] Foto do produto (galeria ou câmera)
- [x] Perfil de usuário com nome, e-mail, foto, loja/unidade e estoque mínimo padrão, além de tema claro/escuro
- [x] Cadastro com senha forte e onboarding de boas-vindas para novos usuários
- [x] Aviso de privacidade e página informativa sobre a LGPD

## Requisitos do projeto e onde estão no código

| Requisito | Onde está |
|---|---|
| Componentização e reuso | `src/components`: `Botao`, `Input`, `Loading` e `Feedback` são usados em todas as telas; `CardProduto`, `CardMovimentacao`, `FormMovimentacao`, `ResumoCard` e `ItemEstoqueBaixo` são específicos |
| Layout responsivo com Flexbox | Todas as telas, com `StyleSheet` e `flexDirection`, `flex` e `gap` |
| Navegação (Expo Router) | `src/app`: Stack raiz, grupo `(auth)` e grupo `(tabs)` com Bottom Tabs |
| Estado local | `useState` e `useEffect` nas telas e formulários |
| Estado global | Zustand: `useAuthStore` (usuário logado) e `useProdutosStore` (produtos, compartilhado entre Início, Produtos e Movimentações) |
| Formulários com validação | Login, cadastro, produto e movimentação, com mensagem de erro em cada campo |
| Feedback visual | `Loading`, `Feedback` (erro, sucesso e aviso) e mensagens de lista vazia |
| Recursos nativos | Câmera (`expo-camera`, leitor de código de barras), notificações locais (`expo-notifications`), seletor de data (`@react-native-community/datetimepicker`) e galeria e câmera (`expo-image-picker`) |
| Ícones vetoriais | `@expo/vector-icons` |
| Firebase | Firestore (leitura, gravação, edição e remoção) e Authentication |
| Git Flow | Veja a seção [Fluxo de trabalho](#fluxo-de-trabalho-git-flow) |

## Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native + Expo | Aplicativo mobile |
| Expo Router | Navegação (Stack + Tabs) |
| TypeScript | Tipagem |
| Firebase Authentication | Login e cadastro |
| Cloud Firestore | Banco de dados NoSQL |
| Zustand | Estado global |
| expo-camera | Leitor de código de barras |
| expo-notifications | Notificação local de estoque baixo |
| @react-native-community/datetimepicker | Seletor de data das movimentações |
| expo-image-picker | Foto do produto |
| @expo/vector-icons | Ícones |

## Pré-requisitos

- [Node.js](https://nodejs.org) **versão 20 ou superior** (testado com a 22)
- [Git](https://git-scm.com)
- Um editor de código, como o [VS Code](https://code.visualstudio.com)
- Um projeto no [Firebase](https://console.firebase.google.com) (passo a passo abaixo)
- Para testar no celular: o app **Expo Go** (Android ou iOS)

Confira as versões:

```bash
node -v
git --version
```

> Ao instalar, o `npm` pode mostrar avisos `EBADENGINE` sobre pacotes do Firebase pedirem uma versão mais nova do Node. São apenas avisos e o app funciona normalmente.

## Como instalar e rodar

### 1. Clonar o repositório

```bash
git clone https://github.com/rafaelsant05/estok.git
cd estok
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar o Firebase

1. Acesse o [console do Firebase](https://console.firebase.google.com) e clique em **Criar um projeto** (por exemplo, `estok`).
2. Na visão geral do projeto, clique no ícone **Web** (`</>`) e registre um app (por exemplo, `estok-web`). Copie os valores do objeto `firebaseConfig`.
3. Em **Authentication**, clique em **Vamos começar**, abra **E-mail/senha**, ative a primeira opção e salve.
4. Em **Firestore Database**, clique em **Criar banco de dados** e escolha uma região (por exemplo, `southamerica-east1`). Antes de usar o app, publique as regras do arquivo `firestore.rules`; não mantenha regras abertas de teste em produção.

O arquivo `firebase.json` aponta para `firestore.rules`. Publique essas regras pelo console do Firebase ou pela Firebase CLI antes de disponibilizar o app.

### 4. Criar o arquivo `.env`

Na raiz do projeto, copie o arquivo de exemplo:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Git Bash, Linux ou macOS
cp .env.example .env
```

Abra o `.env` e preencha com os valores do `firebaseConfig`, **sem aspas e sem espaços**. O bucket do Storage é opcional; sem ele, a foto de perfil é mantida localmente:

```
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
# Opcional: necessário para sincronizar fotos de perfil.
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx
```

> O arquivo `.env` está no `.gitignore` e **nunca deve ser enviado ao GitHub**. Copie a `apiKey` do console em vez de digitar, pois ela mistura `I`, `l` e `1`.

### 5. Rodar o app

```bash
npx expo start --clear
```

O `--clear` garante que o Expo leia o `.env`. Depois:

- Aperte **`w`** para abrir no navegador (`http://localhost:8081`), ou
- Leia o **QR code** com o app **Expo Go** no celular (celular e computador na mesma rede Wi-Fi).

Para abrir direto no navegador:

```bash
npx expo start --web --clear
```

> Alguns recursos nativos funcionam melhor no celular ou no emulador do que no navegador: a câmera do leitor de código de barras, o seletor de data e as notificações. No navegador, o scanner oferece um campo para digitar o código.

### 6. Primeiro acesso

1. Abra o app e toque em **Criar conta**.
2. Informe nome, e-mail e uma senha com no mínimo 8 caracteres, letra maiúscula, número e caractere especial.
3. Após o cadastro, dê boas-vindas ao Estok e configure seu nome e, se quiser, uma foto de perfil.
4. Ao concluir o onboarding, você terá acesso às abas **Início**, **Produtos**, **Movimentações** e **Configurações**.

## Roteiro de uso

1. Em **Produtos**, toque no botão **+** e cadastre alguns produtos (nome, categoria, quantidade, estoque mínimo e, se quiser, o código de barras).
2. Em **Movimentações**, toque em **Nova movimentação** e registre uma **entrada** (por exemplo, uma compra) e uma **saída** (por exemplo, uma venda). A quantidade do produto é atualizada na hora.
3. Tente registrar uma saída maior que o estoque: o app recusa e mantém o estoque.
4. Em **Início**, veja o resumo e a lista dos produtos com estoque abaixo do mínimo.
5. Em **Escanear código de barras**, leia (ou digite) o código de um produto para abri-lo. Se o código não existir, o app oferece cadastrá-lo.

## Regras de segurança do Firestore

O arquivo [`firestore.rules`](./firestore.rules) permite que cada usuário autenticado crie, leia e atualize o próprio documento e acesse somente seus produtos e movimentações. Publique-o em **Firestore Database → Regras** antes de usar o app.

## Estrutura do projeto

```
estok/
├── src/
│   ├── app/
│   │   ├── _layout.tsx             # Stack raiz e redirecionamento por login
│   │   ├── (auth)/                 # login.tsx e cadastro.tsx
│   │   ├── (tabs)/                 # Início, Produtos, Movimentações e Configurações
│   │   ├── boas-vindas.tsx         # Apresentação para novos usuários
│   │   ├── configurar-perfil.tsx   # Nome e foto no primeiro acesso
│   │   ├── produto/                # novo.tsx e [id].tsx
│   │   ├── lgpd.tsx                # Aviso de privacidade
│   │   └── scanner.tsx             # Leitor de código de barras
│   ├── components/                 # Botao, Input, Loading, Feedback, CardProduto,
│   │                               # CardMovimentacao, FormMovimentacao,
│   │                               # ResumoCard e ItemEstoqueBaixo
│   ├── services/                   # Firebase, perfil, produtos, movimentações e notificações
│   ├── store/                      # useAuthStore, useThemeStore e useProdutosStore
│   ├── types/                      # Tipos TypeScript (Produto, Movimentacao)
│   └── constants/                  # Cores do app
├── .env.example                    # Modelo das variáveis do Firebase
└── README.md
```

## Modelo de dados (Firestore)

```
users/{uid}
    nome, email, criadoEm, onboardingConcluido,
    photoUrl, storeName (opcional), defaultMinStock (opcional), updatedAt

users/{uid}/produtos/{produtoId}
    nome, categoria, quantidade, estoqueMinimo,
    codigoBarras (opcional), fotoUri (opcional), criadoEm

users/{uid}/movimentacoes/{movimentacaoId}
    produtoId, produtoNome, tipo ("entrada" | "saida"),
    quantidade, motivo, data
```

Um produto está com **estoque baixo** quando `quantidade <= estoqueMinimo`.

## Fluxo de trabalho (Git Flow)

- `main`: branch protegida. Só recebe código por **Pull Request** com pelo menos **1 aprovação** de outro integrante.
- `DEV-Rafael`, `DEV-Rickson`, `DEV-Jonathan` e `DEV-Bruno`: branch de desenvolvimento de cada integrante, no lugar da `develop`, conforme combinado com o professor.
- Cada funcionalidade pronta vira um Pull Request da branch pessoal para a `main`, revisado por outro integrante.
- Commits pequenos e frequentes, no formato `feat:`, `fix:`, `docs:`, `style:` e `chore:`.

## Equipe e divisão de tarefas

| Integrante | GitHub | Responsabilidades |
|---|---|---|
| **Rafael Carvalho dos Santos** | [@rafaelsant05](https://github.com/rafaelsant05) | Setup do projeto, Firebase, navegação, componentes base, autenticação (login e cadastro), tela da aba Movimentações, integração das partes e documentação |
| **Rickson Figueiredo Pessanha** | [@RicksonDeveloper](https://github.com/RicksonDeveloper) | Produtos: service e store, lista com busca e filtro, formulário de cadastro e edição, foto do produto |
| **Jonathan Marinho** | [@jmarinhorod](https://github.com/jmarinhorod) | Movimentações de estoque: service com transação, formulário com validação e card do histórico |
| **Bruno França** | [@bruno251142](https://github.com/bruno251142) | Tela inicial (painel com resumo e produtos com estoque baixo), leitor de código de barras e notificação de estoque baixo |

## Solução de problemas

| Problema | O que fazer |
|---|---|
| `auth/invalid-api-key` | A `apiKey` do `.env` está errada. Copie de novo do console do Firebase e reinicie com `npx expo start --clear` |
| Mudei o `.env` e nada mudou | Pare o servidor (Ctrl+C) e rode de novo com `--clear` |
| Tela em branco no navegador | Abra o Console (F12) e veja a mensagem de erro |
| O app não conecta no Expo Go | Celular e computador precisam estar na mesma rede Wi-Fi |
| A câmera não abre no navegador | A câmera só funciona no celular. Use o campo para digitar o código |
| Os dados não aparecem | Confira se o Firestore foi criado e se o login está ativo |

## Vídeo de demonstração

[Assista ao vídeo de demonstração](LINK_DO_VIDEO)

## Licença

Projeto acadêmico. Consulte o arquivo [LICENSE](LICENSE).

© 2026 Estok • Desenvolvido por Rafael Carvalho, Rickson Figueiredo, Jonathan Marinho e Bruno França
