# Estok — Checklist de QA e decisão de release

Documento operacional para copiar para Notion/Google Docs. Marque cada item somente após executar o teste e registrar evidência. Este checklist não substitui a validação em dispositivos físicos nem confirma, por si só, que um release foi aprovado.

## 1. Identificação da rodada

- Versão/build candidato:
- Commit:
- Data:
- Responsável por QA:
- Responsável pela decisão de release:
- Projeto Firebase/ambiente:
- Android — aparelho, versão do SO e resultado:
- iOS — aparelho, versão do SO e resultado:
- Link para evidências (capturas, gravações ou logs):

## 2. Preparação

- [ ] Confirmar que o candidato testado corresponde ao commit informado acima.
- [ ] Instalar o candidato em aparelho físico; registrar modelo e versão do sistema operacional.
- [ ] Usar ambiente Firebase de teste/staging e contas de teste sem dados reais.
- [ ] Confirmar que a configuração aponta para o projeto Firebase esperado.
- [ ] Confirmar que as regras do Firestore estão publicadas e restringem leitura/escrita ao usuário autenticado proprietário dos dados. Não liberar com regras temporárias ou abertas.
- [ ] Preparar contas distintas de teste para verificar isolamento de dados.
- [ ] Preparar produtos de teste para cenários válidos, estoque zero, estoque baixo e código de barras.
- [ ] Conceder permissões de câmera/notificações quando solicitadas e também preparar um cenário de permissão negada.
- [ ] Não usar informações pessoais ou dados reais de clientes durante o QA.

## 3. Portões automatizados

Executar na mesma revisão/commit do candidato e guardar a saída como evidência:

- [ ] `npm run lint` — termina com código de saída 0.
- [ ] `npx tsc --noEmit` — termina com código de saída 0.
- [ ] `node --test src/utils/negocio.test.js` — todos os testes passam, sem falhas.
- [ ] Registrar versão do Node, commit e resultado de cada comando.
- [ ] Instalar/abrir o artefato candidato gerado pelo processo de release em cada plataforma suportada.

**Aprovação do portão:** todos os comandos acima passam no mesmo commit candidato. Se uma etapa não se aplicar ou não puder ser executada, registrar justificativa e obter aprovação explícita do responsável pelo release; não reportar como aprovada.

## 4. Casos de QA funcional

Em cada caso, marque Passou/Falhou/Bloqueado e registre a evidência. Executar os casos críticos em cada plataforma suportada.

### Inicialização e autenticação

- [ ] **AUTH-01 — Inicialização online:** abrir o app com conexão disponível. Esperado: chega à tela apropriada sem crash, tela permanentemente carregando ou erro não tratado.
- [ ] **AUTH-02 — Cadastro válido:** criar uma conta de teste com dados válidos. Esperado: cadastro concluído e acesso às telas autenticadas.
- [ ] **AUTH-03 — Entrada inválida:** testar campos obrigatórios inválidos/vazios. Esperado: ação bloqueada e mensagem compreensível; nenhum registro inválido é criado.
- [ ] **AUTH-04 — Login e logout:** entrar e sair da conta. Esperado: usuário autenticado vê seus dados e, após sair, não permanece em área autenticada.
- [ ] **AUTH-05 — Dados entre contas:** criar dados na conta A e autenticar a conta B. Esperado: B não consegue visualizar nem alterar os dados de A.
- [ ] **AUTH-06 — Erro recuperável:** provocar erro de autenticação e corrigir os campos. Esperado: feedback é visível e deixa de exibir erro antigo quando apropriado; é possível tentar novamente.

### Produtos e código de barras

- [ ] **PROD-01 — Cadastro:** criar produto com campos válidos, quantidade e estoque mínimo. Esperado: produto aparece na lista e os valores persistidos estão corretos.
- [ ] **PROD-02 — Validação:** enviar formulário com campo obrigatório ausente ou valor inválido. Esperado: salvamento bloqueado e indicação do que corrigir.
- [ ] **PROD-03 — Edição:** alterar produto existente e reabrir seus detalhes. Esperado: alterações persistidas sem perder dados que não foram editados.
- [ ] **PROD-04 — Exclusão:** iniciar remoção e cancelar; depois repetir e confirmar. Esperado: cancelar preserva o produto; confirmar remove o produto e a lista atualiza.
- [ ] **PROD-05 — Busca textual/filtro:** buscar por nome e aplicar/remover categoria. Esperado: resultados correspondem à busca e filtros combinados; estado vazio é compreensível.
- [ ] **PROD-06 — Normalização de código:** cadastrar/buscar código com espaços ou formatação que a regra do app normalize. Esperado: entrada e busca seguem a mesma normalização definida pelo app.
- [ ] **PROD-07 — Código desconhecido:** buscar código sem produto correspondente. Esperado: feedback claro e nenhuma abertura indevida de outro produto.
- [ ] **PROD-08 — Foto opcional:** conceder e negar permissão de câmera/galeria. Esperado: fluxo permitido funciona; ao negar, o app continua utilizável e informa a limitação sem crash.

### Scanner

- [ ] **SCAN-01 — Permissão concedida:** abrir scanner e ler código existente. Esperado: produto correto é localizado e o fluxo é concluído uma única vez.
- [ ] **SCAN-02 — Leituras repetidas:** manter o código no campo de visão ou provocar callbacks consecutivos. Esperado: não há navegação, ação ou gravação duplicada.
- [ ] **SCAN-03 — Código desconhecido:** ler código não cadastrado. Esperado: mensagem/ação de continuação adequada, sem associar produto incorreto.
- [ ] **SCAN-04 — Permissão negada:** negar acesso à câmera. Esperado: explicação e caminho alternativo disponível quando previsto, sem loop ou crash.
- [ ] **SCAN-05 — Busca manual:** digitar o código, quando disponível. Esperado: resultado coerente com a busca pelo scanner.
- [ ] **SCAN-06 — Rede indisponível:** repetir a busca sem conexão. Esperado: comportamento compatível com os dados locais e erro de rede comunicado; não afirmar sucesso de consulta remota sem confirmação.

### Movimentações e integridade do estoque

- [ ] **MOV-01 — Entrada válida:** registrar entrada positiva. Esperado: quantidade do produto aumenta pelo valor correto e histórico mostra a movimentação.
- [ ] **MOV-02 — Saída válida:** registrar saída menor ou igual ao estoque disponível. Esperado: quantidade diminui corretamente e histórico é atualizado.
- [ ] **MOV-03 — Saída maior que estoque:** tentar retirar mais que o saldo. Esperado: operação recusada e estoque/histórico permanecem inalterados.
- [ ] **MOV-04 — Entrada inválida:** tentar quantidade vazia, zero ou inválida conforme validação da tela. Esperado: operação bloqueada e sem alteração persistida.
- [ ] **MOV-05 — Filtros do histórico:** filtrar por tipo, produto e categoria, isolados e combinados. Esperado: resultados correspondem aos filtros e a limpeza restaura a lista.
- [ ] **MOV-06 — Concorrência/conflito:** em duas sessões de teste, tentar saídas que individualmente cabem no saldo, mas juntas o excederiam. Esperado: persistência não deixa o estoque negativo; resultado e mensagens são registrados.
- [ ] **MOV-07 — Falha de rede:** interromper conexão durante o envio. Esperado: falha não é apresentada como sucesso e o usuário consegue verificar o estado antes de repetir, sem duplicação silenciosa.

### Início, alertas e experiência

- [ ] **UX-01 — Resumo:** comparar os números da Home com os produtos cadastrados. Esperado: totais e alertas de estoque baixo correspondem aos dados.
- [ ] **UX-02 — Estado vazio/carregamento/erro:** verificar telas sem dados e durante falha de carregamento. Esperado: estados explicativos e possibilidade de recuperação, sem tela vazia inexplicada.
- [ ] **UX-03 — Navegação:** alternar entre Início, Produtos e Movimentações repetidamente. Esperado: navegação estável, sem perda indevida de estado ou tela travada.
- [ ] **UX-04 — Toque e legibilidade:** testar em tamanho de tela pequeno e escala de fonte ampliada. Esperado: ações principais acessíveis, texto legível e sem conteúdo essencial cortado.
- [ ] **UX-05 — Feedback e copy:** revisar erros, confirmações, permissões e estados vazios. Esperado: texto curto, claro, sem jargão, indicando o próximo passo; nenhuma ação destrutiva ambígua.
- [ ] **UX-06 — Notificação local:** validar solicitação de permissão e comportamento com permissão concedida/negada. Esperado: app continua funcional e não solicita repetidamente sem necessidade.
- [ ] **UX-07 — Interrupções:** enviar app para segundo plano e retornar durante carregamento e navegação. Esperado: sem crash, duplicação de ação ou estado enganoso.
- [ ] **UX-08 — Desempenho percebido:** rolar listas de tamanho representativo e aplicar filtros. Esperado: sem travamento impeditivo, congelamento ou resposta atrasada que impeça o uso.

## 5. Registro de defeitos

Para cada falha, registrar:

- ID e título:
- Commit/build e plataforma:
- Passos para reproduzir:
- Resultado esperado:
- Resultado observado:
- Frequência (sempre/intermitente/uma vez):
- Evidência:
- Severidade (P0/P1/P2/P3):
- Responsável e situação:
- Revalidação após correção:

### Severidade

- **P0 — Crítico:** perda/corrupção de dados, exposição entre contas, estoque inconsistente/negativo, ou app inutilizável. Bloqueia o release.
- **P1 — Alto:** fluxo principal indisponível ou risco relevante sem alternativa aceitável. Bloqueia o release.
- **P2 — Moderado:** problema com alternativa razoável, impacto limitado e sem violação de integridade. Pode ser aceito somente com decisão documentada e responsável.
- **P3 — Baixo:** detalhe visual/copy sem impacto funcional relevante. Pode ser registrado para manutenção futura.

## 6. Matriz de decisão Go/No-Go

### GO — todos os critérios obrigatórios devem ser verdadeiros

- [ ] Portões automatizados aprovados no commit candidato.
- [ ] AUTH-05 (isolamento de dados entre contas) passou.
- [ ] PROD-01 a PROD-04 passaram.
- [ ] SCAN-01 e SCAN-02 passaram em aparelho físico com câmera.
- [ ] MOV-01, MOV-02, MOV-03 e MOV-06 passaram; não houve saldo incorreto, duplicação ou movimentação indevida.
- [ ] Nenhum defeito P0 ou P1 está aberto.
- [ ] Cada plataforma declarada como suportada foi validada em pelo menos um aparelho físico compatível; limitações e dispositivos usados estão registrados.
- [ ] Regras e configuração do Firebase foram verificadas no ambiente de destino; nenhum ambiente de teste ou regra aberta será usado em produção.
- [ ] Artefato final instala e abre no aparelho de QA; versão/build e commit são rastreáveis.
- [ ] Há plano de monitoramento e de interrupção/retorno compatível com o processo de distribuição.
- [ ] Responsável pelo QA e responsável pelo release registraram aprovação e data.

**Decisão:** marcar GO somente quando todos os itens obrigatórios estiverem marcados e houver evidência. Se houver exceção, ela deve ser escrita, ter mitigação, responsável e aceite explícito; exceções não podem incluir P0/P1 nem os critérios críticos de integridade e isolamento.

### NO-GO — qualquer condição abaixo interrompe a liberação

- [ ] Qualquer defeito P0 ou P1 aberto.
- [ ] Falha em bloqueio de saída acima do estoque, integridade de movimentação ou isolamento entre contas.
- [ ] Scanner registra/aciona leituras duplicadas ou resolve código para produto incorreto.
- [ ] Um portão automatizado falhou ou foi executado em commit diferente do candidato.
- [ ] Não foi possível confirmar ambiente Firebase, regras de acesso ou identidade do artefato.
- [ ] Plataforma suportada não foi testada em aparelho físico e não há exceção aprovada.
- [ ] QA sem evidências suficientes, ou sem responsáveis pela aprovação.

**Ação em NO-GO:** não distribuir. Abrir defeito, corrigir, gerar novo candidato e repetir os casos afetados, os casos críticos relacionados e os portões automatizados no novo commit.

## 7. Aprovação

- Resultado final: GO / NO-GO
- Build/versão:
- Commit:
- Exceções aceitas e mitigação (se houver):
- Responsável por QA — nome/data:
- Responsável pelo release — nome/data:
- Evidências finais:

## 8. Pós-release e manutenção

- [ ] Confirmar que a versão distribuída corresponde ao candidato aprovado.
- [ ] Monitorar erros de autenticação, leitura/gravação e movimentações após a liberação.
- [ ] Ter canal e responsável definidos para receber incidentes.
- [ ] Em incidente de integridade ou isolamento, interromper a distribuição/uso afetado e iniciar resposta antes de qualquer melhoria não crítica.
- [ ] Manter regras de negócio em funções testáveis e fora de lógica visual; adicionar regressão antes de alterar comportamento do estoque, normalização ou busca.
- [ ] Revisar dependências e compatibilidade antes de atualizações; repetir os portões e o QA dos fluxos impactados.
- [ ] Registrar feedback recorrente de UX e priorizar manutenção sem misturar mudanças cosméticas com alterações de regras críticas.
