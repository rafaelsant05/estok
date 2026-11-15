Estok

Aplicativo mobile de controle de estoque para MEI (Microempreendedor Individual), desenvolvido em React Native com Expo e Firebase como projeto final da disciplina de Desenvolvimento Mobile.

Muitos MEIs ainda controlam o estoque em caderno ou de cabeça. O Estok permite cadastrar produtos, registrar entradas e saídas e saber o que está acabando, tudo pelo celular.

O escopo do app é somente estoque: não há vendas, preços, lucro ou margem.

Funcionalidades
 Login e cadastro de usuários (Firebase Authentication), com validação dos campos
 Cada usuário enxerga apenas os próprios dados
 Navegação com Stack e Bottom Tabs (Início, Produtos e Movimentações)
 Camada de dados de produtos no Firestore (criar, listar, buscar, editar e remover)
 Lista de produtos com busca e filtro por categoria
 Cadastro e edição de produtos com validação e foto
 Entradas e saídas de estoque, com histórico
 Tela inicial com resumo e produtos com estoque baixo
 Leitura de código de barras com a câmera

Marque as caixas [x] conforme as funcionalidades forem concluídas.

Tecnologias
Tecnologia	Uso
React Native + Expo	Aplicativo mobile
Expo Router	Navegação (Stack + Tabs)
TypeScript	Tipagem
Firebase Authentication	Login e cadastro
Cloud Firestore	Banco de dados NoSQL
Zustand	Estado global
expo-camera	Leitor de código de barras
expo-image-picker	Foto do produto
@expo/vector-icons	Ícones
Capturas de tela

Adicione aqui os prints ou GIFs das principais telas. Salve as imagens em docs/screenshots/ e referencie assim:

![Login](docs/screenshots/login.png)

Login	Cadastro	Produtos
em breve	em breve	em breve
Pré-requisitos
Node.js versão 20 ou superior
Git
Um editor de código, como o VS Code
Um projeto no Firebase (passo a passo abaixo)
Para testar no celular: o app Expo Go (Android ou iOS)

Confira as versões:

bash
node -v
git --version
Como instalar e rodar
1. Clonar o repositório
bash
git clone https://github.com/rafaelsant05/estok.git
cd estok
2. Instalar as dependências
bash
npm install
3. Configurar o Firebase
Acesse o console do Firebase e clique em Criar um projeto (por exemplo, estok).
Na visão geral do projeto, clique no ícone Web (</>) e registre um app (por exemplo, estok-web). Copie os valores do objeto firebaseConfig.
Em Authentication, clique em Vamos começar, abra E-mail/senha, ative a primeira opção e salve.
Em Firestore Database, clique em Criar banco de dados, escolha uma região (por exemplo, southamerica-east1) e inicie no modo de teste.

O modo de teste do Firestore libera o acesso por 30 dias. Depois disso, publique as regras da seção Regras de segurança do Firestore.

4. Criar o arquivo .env

Na raiz do projeto, copie o arquivo de exemplo:

bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Git Bash, Linux ou macOS
cp .env.example .env

Abra o .env e preencha com os valores do firebaseConfig, sem aspas e sem espaços:

EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx

O arquivo .env está no .gitignore e nunca deve ser enviado ao GitHub. Copie a apiKey do console em vez de digitar, pois ela mistura I, l e 1.

5. Rodar o app
bash
npx expo start --clear

O --clear garante que o Expo leia o .env. Depois:

Aperte w para abrir no navegador (http://localhost:8081), ou
Leia o QR code com o app Expo Go no celular (celular e computador na mesma rede Wi-Fi).

Para abrir direto no navegador:

bash
npx expo start --web --clear

Alguns recursos nativos, como a câmera e o seletor de data, funcionam melhor no celular ou no emulador do que no navegador.

6. Primeiro acesso
Abra o app e toque em Criar conta.
Cadastre um e-mail e uma senha com no mínimo 6 caracteres.
Você será levado às abas Início, Produtos e Movimentações.
O usuário aparece em Authentication → Usuários no console do Firebase.
Regras de segurança do Firestore

Depois que o modo de teste expirar (ou antes da entrega), publique estas regras em Firestore Database → Regras. Elas permitem que cada usuário leia e grave apenas os próprios dados:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
Estrutura do projeto
estok/
├── src/
│   ├── app/
│   │   ├── _layout.tsx            # Stack raiz e redirecionamento por login
│   │   ├── (auth)/                # login.tsx e cadastro.tsx
│   │   ├── (tabs)/                # Início, Produtos e Movimentações
│   │   ├── produto/               # novo.tsx e [id].tsx
│   │   └── scanner.tsx            # Leitor de código de barras
│   ├── components/                # Botao, Input, Loading, Feedback...
│   ├── services/                  # firebase.ts, produtosService.ts, movimentacoesService.ts
│   ├── store/                     # useAuthStore.ts, useProdutosStore.ts
│   ├── types/                     # Tipos TypeScript (Produto, Movimentacao)
│   └── constants/                 # Cores do app
├── .env.example                   # Modelo das variáveis do Firebase
└── README.md
Modelo de dados (Firestore)
users/{uid}/produtos/{produtoId}
    nome, categoria, quantidade, estoqueMinimo,
    codigoBarras (opcional), fotoUri (opcional), criadoEm

users/{uid}/movimentacoes/{movimentacaoId}
    produtoId, produtoNome, tipo ("entrada" | "saida"),
    quantidade, motivo, data
Fluxo de trabalho (Git Flow)
main: branch protegida. Só recebe código por Pull Request com pelo menos 1 aprovação.
DEV-Rafael, DEV-Rickson e DEV-Jonathan: branch de desenvolvimento de cada integrante.
Cada funcionalidade pronta vira um Pull Request da branch pessoal para a main, revisado por outro integrante.
Commits pequenos e frequentes, no formato feat:, fix:, docs:, style: e chore:.
Equipe e divisão de tarefas
Integrante	GitHub	Responsabilidades
Rafel Carvalho dos Santos (Rafael)	@rafaelsant05	Setup do projeto, Firebase, navegação, componentes base, autenticação (login e cadastro) e documentação
Rickson Figueiredo Pessanha (Rickson)	@RicksonDeveloper	Produtos: service e store, lista com busca e filtro, formulário de cadastro e edição, foto do produto
Jonathan Marinho (Jonathan)	@jmarinhorod	Movimentações de estoque, tela inicial com alertas e leitor de código de barras
Vídeo de demonstração

Adicione aqui o link do vídeo (3 a 5 minutos) mostrando o app em funcionamento.

Licença

Projeto acadêmico. Consulte o arquivo LICENSE.