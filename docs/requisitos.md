# Módulo de Controle de Processos de Licenciamento

Especificação de requisitos funcionais, regras de negócio e layout UI/UX.

- Versão: 1.0
- Data: 20/10/2026
- Status: proposta para validação
- Abrangência: unidades de licenciamento
- Fonte de dados integrada: base de dados do BI
- Referências de negócio: planilha de controle de processos SERVIN e seu documento descritivo

## 1. Objetivo

Disponibilizar um módulo para gestão operacional dos processos de licenciamento, permitindo acompanhar a carteira das unidades, distribuir processos, registrar atividades técnicas e administrativas, consultar históricos e produzir relatórios.

A base do BI fornecerá as informações disponíveis sobre o processo de licenciamento. O módulo manterá os dados operacionais produzidos pelas unidades, incluindo distribuição interna, responsáveis, atividades, observações e histórico de acompanhamento.

O mapeamento dos campos disponíveis no BI deverá ser realizado antes da implementação da integração.

## 2. Escopo

O módulo deverá contemplar:

- Consulta e incorporação de processos a partir do BI.
- Cadastro complementar de processos.
- Cadastro manual de processos não disponíveis no BI.
- Múltiplos imóveis, endereços e interessados por processo.
- Distribuição e redistribuição interna.
- Carteira de processos dos técnicos.
- Atividades técnicas e administrativas.
- Situações de acompanhamento, decisões, recursos e encerramento.
- Grupos de acompanhamento.
- Controle de ofícios.
- Localização de processos físicos.
- Indicadores e relatórios.
- Permissões por unidade e ação.
- Histórico e auditoria.
- Importação dos controles legados.

Não estão definidos nesta versão:

- Gravação de alterações na base do BI.
- Tramitação oficial nos sistemas de origem.
- Emissão oficial de alvarás, decisões ou publicações.
- Envio automático de ofícios ou e-mails.
- Regras legais de prazo e vencimento.

O registro de uma ação no módulo não implica sua execução nos sistemas oficiais.

## 3. Integração com a base do BI

| ID | Requisito |
|---|---|
| BI-01 | Consultar a base do BI para localizar processos e obter os dados disponíveis. |
| BI-02 | Vincular cada processo a um identificador estável da origem. Na ausência dele, utilizar uma chave de correspondência definida no mapeamento. |
| BI-03 | Permitir incorporar um processo à carteira sem redigitar os dados disponíveis no BI. |
| BI-04 | Permitir incorporação automática dos processos destinados à unidade, conforme regra configurada e disponibilidade dessa informação na origem. |
| BI-05 | Atualizar periodicamente os campos provenientes do BI, com frequência configurável. |
| BI-06 | Exibir origem dos dados e data e hora da última sincronização bem-sucedida. |
| BI-07 | Preservar os dados operacionais durante as sincronizações. |
| BI-08 | Registrar resultados, falhas, registros não correspondidos e conflitos de sincronização. |
| BI-09 | Impedir duplicações em sincronizações sucessivas. |
| BI-10 | Não excluir nem encerrar automaticamente um processo que deixe de aparecer no BI. Sinalizar a ocorrência para verificação. |
| BI-11 | Permitir cadastro manual e posterior vinculação ao BI sem perda do histórico. |
| BI-12 | Manter disponíveis os dados já sincronizados durante indisponibilidade da integração, indicando sua atualização. |

### 3.1. Regras da integração

1. A integração será de leitura.
2. Cada campo deverá ter origem e responsabilidade de manutenção definidas.
3. Campos provenientes do BI serão apresentados como somente leitura por padrão.
4. Correções locais, quando autorizadas, deverão ser registradas separadamente, com justificativa e autoria.
5. A sincronização não poderá sobrescrever complementações operacionais.
6. Situação e unidade de origem deverão ser distinguidas da situação de acompanhamento e distribuição interna.
7. Divergências deverão ficar visíveis para usuários autorizados.
8. O histórico anterior à implantação dependerá dos dados efetivamente disponíveis.
9. A data de sincronização não deverá ser apresentada como data de atualização da origem, salvo quando forem comprovadamente equivalentes.

## 4. Cadastro e consulta dos processos

| ID | Requisito |
|---|---|
| PR-01 | Manter um cadastro único por processo, com vínculos às unidades e histórico de acompanhamento. |
| PR-02 | Registrar número, protocolo, sistema de origem, assunto, autuação e processos ou alvarás relacionados. |
| PR-03 | Permitir múltiplos SQLs, identificadores INCRA e referências de áreas públicas, com identificação do principal quando aplicável. |
| PR-04 | Permitir múltiplos endereços, inclusive diferentes frentes do imóvel. |
| PR-05 | Permitir múltiplos interessados, identificando seus papéis. |
| PR-06 | Registrar prioridade, motivo e observações. |
| PR-07 | Registrar áreas, zoneamento, categoria de uso, equipamento público e subprefeitura. |
| PR-08 | Registrar incidências e valores aplicáveis: isenção de taxas, OODC, CEPAC, quota de solidariedade, quota ambiental, doação de calçada, fruição pública e fachada ativa. |
| PR-09 | Registrar legislação, instrumentos urbanísticos e certificado de irregularidade. |
| PR-10 | Permitir preenchimento progressivo sem exigir todos os dados complementares para iniciar o acompanhamento. |
| PR-11 | Pesquisar por número, protocolo, SQL/INCRA, endereço, interessado e processo relacionado, incluindo vínculos complementares. |
| PR-12 | Filtrar por unidade, divisão, responsável, sistema, assunto, prioridade, situação, instância, grupo e período. |
| PR-13 | Exibir a ficha organizada em identificação, imóveis, interessados, licenciamento, gestão, eventos e histórico. |

Os campos deverão ser preenchidos pelo BI quando disponíveis. Os demais poderão ser complementados manualmente conforme permissão.

Valores desconhecidos, não aplicáveis, negativos e iguais a zero deverão ser tratados distintamente.

## 5. Distribuição e carteira

| ID | Requisito |
|---|---|
| DI-01 | Distribuir processos para unidades, divisões e técnicos, conforme permissões. |
| DI-02 | Registrar responsável, data, autor da distribuição e observação ou justificativa. |
| DI-03 | Permitir redistribuição, preservando responsáveis e períodos anteriores. |
| DI-04 | Exibir processos ainda não distribuídos para diretoria ou técnico. |
| DI-05 | Disponibilizar “Minha carteira”, com processos atribuídos ao usuário. |
| DI-06 | Disponibilizar “Minhas atividades”, com atividades abertas e concluídas do usuário. |
| DI-07 | Permitir à chefia consultar a distribuição por técnico, situação e prioridade. |

### 5.1. Regras

- Atribuir um processo não inicia automaticamente uma análise.
- A carteira representa responsabilidade; as atividades representam trabalho registrado.
- Redistribuições não alteram a autoria das atividades anteriores.
- Responsabilidade simultânea de vários técnicos depende de validação.
- A transferência entre unidades deverá preservar o histórico.

## 6. Atividades técnicas e administrativas

| ID | Requisito |
|---|---|
| EV-01 | Registrar atividades vinculadas ao processo, classificadas como técnicas ou administrativas. |
| EV-02 | Apresentar os dados básicos automaticamente ao selecionar o processo. |
| EV-03 | Registrar tipo, responsável, início, término e descrição/observações. |
| EV-04 | Permitir iniciar e concluir atividades, preservando as anteriores. |
| EV-05 | Disponibilizar tipos configuráveis, com opções técnicas e administrativas. |
| EV-06 | Registrar consultas e encaminhamentos com unidade ou órgão destinatário. |
| EV-07 | Registrar comunique-se, espera por documentos ou pagamentos, propostas de decisão, publicações e recursos. |
| EV-08 | Permitir que eventos específicos alterem a situação de acompanhamento conforme regra configurada. |
| EV-09 | Exibir linha do tempo com atividades, situações, distribuições, decisões e encerramentos. |
| EV-10 | Permitir correções autorizadas, preservando valores anteriores e autoria. |
| EV-11 | Impedir término anterior ao início. |

### 6.1. Regras

- Eventos administrativos não alterarão a situação principal sem regra expressa.
- A interface deverá informar o efeito de um evento sobre a situação antes da confirmação.
- Atividades simultâneas dependem de validação do fluxo.
- Duração decorrida não equivale a horas efetivamente trabalhadas.
- Registro retroativo, quando permitido, deverá manter a data real da ação e a data de lançamento.

## 7. Situações, decisões e encerramento

| ID | Requisito |
|---|---|
| ST-01 | Manter situação, instância, decisão e condição de encerramento em campos distintos. |
| ST-02 | Registrar mudanças de situação com data, autoria e evento de origem, quando houver. |
| ST-03 | Registrar decisões e publicações no DOC, preservando as anteriores. |
| ST-04 | Registrar recursos e reconsiderações sem apagar decisões precedentes. |
| ST-05 | Encerrar o acompanhamento por ação ou evento autorizado, com data e motivo. |
| ST-06 | Retirar encerrados da visão padrão de ativos, mantendo consultas e relatórios. |
| ST-07 | Permitir reabertura autorizada com justificativa, preservando encerramentos anteriores. |

Deferimento ou indeferimento isolado não encerra automaticamente o acompanhamento.

## 8. Grupos de acompanhamento

| ID | Requisito |
|---|---|
| GR-01 | Criar grupos configuráveis, como Hospitais, CEUs, TJ-SP e SESCs. |
| GR-02 | Vincular um processo a mais de um grupo. |
| GR-03 | Exibir os dados atuais do cadastro central, sem cópias independentes. |
| GR-04 | Disponibilizar filtros e relatórios por grupo. |

## 9. Ofícios e processos físicos

| ID | Requisito |
|---|---|
| OF-01 | Cadastrar ofícios com número, ano, unidade, responsável, interessado/destinatário e observações. |
| OF-02 | Vincular ofícios aos processos correspondentes. |
| OF-03 | Registrar envio, resposta e encerramento. |
| OF-04 | Consultar ofícios pendentes de resposta e encerrados. |
| FI-01 | Disponibilizar visão simplificada de processos físicos. |
| FI-02 | Registrar localização, contêiner, quantidade de volumes e caixas. |
| FI-03 | Preservar histórico da localização física. |
| FI-04 | Distinguir arquivamento físico de encerramento do acompanhamento. |

## 10. Indicadores e relatórios

| ID | Requisito |
|---|---|
| RE-01 | Apresentar totais de ativos, encerrados, prioritários e sem distribuição. |
| RE-02 | Apresentar carteira por unidade, divisão, técnico, assunto e situação. |
| RE-03 | Apresentar atividades iniciadas, abertas e concluídas por período e responsável. |
| RE-04 | Calcular permanência nas situações e duração das atividades com base no histórico. |
| RE-05 | Identificar processos sem movimentação operacional há período informado pelo usuário. |
| RE-06 | Consultar decisões, encerramentos e reaberturas por período. |
| RE-07 | Exportar resultados filtrados para planilha, respeitando permissões. |
| RE-08 | Informar data de referência e filtros dos relatórios. |

Indicadores históricos deverão usar apenas períodos com dados confiáveis. Ausência de histórico não poderá ser tratada como duração zero.

## 11. Usuários, permissões e auditoria

### 11.1. Perfis propostos

| Perfil | Permissões principais |
|---|---|
| Administrador | Configurar unidades, permissões, referências e integração. |
| Gestor da unidade | Consultar a carteira, distribuir e acompanhar relatórios. |
| Técnico | Consultar carteira e registrar atividades autorizadas. |
| Administrativo | Registrar atividades administrativas, ofícios e localização física. |
| Consulta | Visualizar informações e relatórios autorizados. |

### 11.2. Requisitos

| ID | Requisito |
|---|---|
| AC-01 | Integrar à autenticação existente na aplicação. |
| AC-02 | Controlar acesso por unidade e ação, admitindo usuários em múltiplas unidades. |
| AC-03 | Aplicar restrições às telas, serviços, consultas e exportações. |
| AC-04 | Auditar inclusões, alterações, distribuições, encerramentos e reaberturas. |
| AC-05 | Preservar histórico de usuários e unidades desativados. |
| AC-06 | Evitar perda silenciosa em edições simultâneas. |

## 12. Migração da planilha

| ID | Requisito |
|---|---|
| MI-01 | Importar registros mediante correspondência com processos do BI e do módulo. |
| MI-02 | Apresentar prévia com registros válidos, duplicidades e inconsistências. |
| MI-03 | Normalizar situações, unidades, nomes e datas por mapeamento revisado. |
| MI-04 | Separar múltiplos vínculos sem eliminar a informação original. |
| MI-05 | Não importar exemplos, legendas e cabeçalhos como registros operacionais. |
| MI-06 | Preservar origem e lote de importação. |
| MI-07 | Não inventar datas ou eventos históricos ausentes na origem. |

## 13. Requisitos técnicos e operacionais

- Listagens paginadas e filtros processados no servidor.
- Credencial de leitura para acesso à base do BI.
- Consultas à origem dimensionadas para evitar sobrecarga.
- Sincronização em segundo plano e reprocessável sem duplicação.
- Operações transacionais para alterações conjuntas em evento, situação e histórico.
- Validação de identificadores, datas, áreas e valores.
- Mensagens compreensíveis sem exposição de detalhes internos.
- Backup e recuperação conforme a política da aplicação.
- Metas de desempenho definidas após levantamento de volume e concorrência.
- Monitoramento de falhas da integração.
- Datas apresentadas no padrão brasileiro, com fuso consistente.

## 14. Layout e experiência do usuário — UI/UX

Esta seção define a proposta de interface para o módulo. Suas escolhas deverão ser validadas com gestores, técnicos e equipe administrativa.

### 14.1. Princípios

1. Priorizar as tarefas frequentes: localizar, distribuir, registrar atividade e acompanhar.
2. Manter consistência com o sistema que receberá o módulo.
3. Apresentar primeiro as informações necessárias à decisão.
4. Exibir detalhes progressivamente, sem sobrecarregar a tela inicial.
5. Preservar filtros e posição da lista ao retornar de um processo.
6. Diferenciar consulta, edição e confirmação.
7. Utilizar linguagem do trabalho das unidades.
8. Informar claramente o resultado das ações.
9. Evitar redigitação de informações existentes.
10. Garantir operação por teclado e compatibilidade com tecnologias assistivas.

### 14.2. Estrutura geral

A interface deverá utilizar:

- Navegação lateral consistente com a aplicação.
- Identificação visível da unidade em consulta.
- Área principal ampla para listas e ficha do processo.
- Título claro e descrição curta quando necessária.
- Ação principal destacada por contexto.
- Navegação hierárquica na ficha e nas configurações.
- Menu do usuário e identificação do perfil de acesso.

Se a aplicação já possuir cabeçalho e menu, o módulo deverá reutilizá-los, evitando navegações duplicadas.

A troca de unidade deverá atualizar o contexto visível e as permissões aplicáveis. Antes de abandonar alterações não salvas, a interface deverá avisar o usuário.

### 14.3. Navegação proposta

| Item | Finalidade |
|---|---|
| Visão geral | Resumo gerencial e acesso às pendências. |
| Processos | Carteira da unidade e pesquisa completa. |
| Minha carteira | Processos atribuídos ao usuário. |
| Minhas atividades | Atividades abertas e concluídas do usuário. |
| Grupos | Acompanhamentos temáticos. |
| Ofícios | Controle de comunicações. |
| Arquivo físico | Localização dos processos físicos. |
| Relatórios | Indicadores e exportações. |
| Configurações | Cadastros, permissões e integração. |

Os itens serão exibidos conforme perfil e permissão.

“Ativos” e “Encerrados” serão visões do cadastro de processos, sem duplicação de registros.

### 14.4. Tela inicial por perfil

#### Gestor

- Totais de ativos, prioritários e sem distribuição.
- Processos sem movimentação operacional no período selecionado.
- Distribuição da carteira por técnico.
- Lista de processos que precisam de encaminhamento.
- Acesso direto às consultas que compõem cada indicador.

#### Técnico

- Atividades abertas.
- Processos atribuídos sem atividade iniciada.
- Processos prioritários da carteira.
- Últimas movimentações relevantes.
- Atalho para registrar atividade.

#### Administrativo

- Atividades administrativas abertas.
- Ofícios pendentes de resposta.
- Processos aguardando distribuição.
- Acesso à localização física.

Os indicadores deverão abrir a listagem correspondente, com os filtros aplicados.

Não exibir “atrasado” ou “vencido” sem prazo e regra definidos. Utilizar “sem movimentação há X dias” quando essa for a informação disponível.

### 14.5. Listagem de processos

A tabela será a visualização principal da carteira, adequada à comparação de muitos registros.

#### Ordem dos elementos

1. Título, unidade e quantidade de resultados.
2. Ação principal “Adicionar processo”, conforme permissão.
3. Busca.
4. Filtros frequentes.
5. Filtros avançados.
6. Resumo dos filtros ativos.
7. Tabela.
8. Paginação.

#### Colunas padrão

| Coluna | Comportamento |
|---|---|
| Processo | Link explícito para a ficha e ação de copiar número. |
| Interessado principal | Nome com acesso ao conteúdo completo quando abreviado. |
| Assunto | Descrição resumida. |
| Unidade/divisão | Responsabilidade interna atual. |
| Técnico | Responsável ou “Não atribuído”. |
| Situação de acompanhamento | Texto e indicador visual discreto. |
| Última movimentação | Data da última ação operacional relevante. |
| Prioridade | Identificação textual, com motivo acessível. |
| Ações | Menu de ações secundárias autorizadas. |

Requisitos adicionais:

- Permitir escolher colunas adicionais.
- Permitir ordenação nos campos compatíveis.
- Indicar coluna e direção da ordenação.
- Preservar preferências do usuário.
- Não colocar todos os campos do cadastro na tabela.
- Não depender exclusivamente do clique na linha.
- Evitar truncar o número do processo.
- Distinguir última movimentação operacional de última sincronização.
- Paginar com tamanho configurável.
- Preservar busca, filtros, página e ordenação ao retornar.
- Limitar rolagem horizontal à área da tabela quando necessária.

### 14.6. Busca e filtros

Busca por:

- Número do processo ou protocolo.
- SQL/INCRA.
- Endereço.
- Interessado.

Filtros frequentes:

- Unidade/divisão.
- Técnico.
- Situação.
- Prioridade.
- Ativos ou encerrados.

Filtros avançados:

- Sistema.
- Assunto.
- Instância.
- Grupo.
- Subprefeitura.
- Período, com indicação da data filtrada.
- Ausência de movimentação.
- Presença ou ausência de responsável.

Comportamentos:

- Exibir filtros ativos com remoção individual.
- Oferecer “Limpar filtros”.
- Mostrar quantidade de resultados.
- Diferenciar “sem resultados” de “erro na consulta”.
- Preservar contexto ao navegar.
- Permitir salvar consultas frequentes como evolução proposta.
- Não inserir dados pessoais sensíveis em URLs compartilháveis.

### 14.7. Ficha do processo

#### Cabeçalho

Apresentar:

- Número e protocolo.
- Assunto.
- Interessado principal.
- Unidade e técnico responsáveis.
- Situação de acompanhamento.
- Prioridade.
- Condição de ativo ou encerrado.

Ações conforme permissão:

- Registrar atividade.
- Distribuir ou redistribuir.
- Editar dados complementares.
- Encerrar ou reabrir acompanhamento.

Usar uma ação principal visualmente dominante. Ações menos frequentes poderão ficar em menu secundário, sem ocultar as tarefas recorrentes do perfil.

#### Organização do conteúdo

| Seção | Conteúdo |
|---|---|
| Resumo | Dados essenciais, atividade atual, pendências e última movimentação. |
| Atividades e histórico | Linha do tempo, atividades abertas e registros anteriores. |
| Imóveis e interessados | SQLs, endereços, proprietários e demais vínculos. |
| Dados do licenciamento | Áreas, uso, incidências, valores e legislação. |
| Ofícios | Ofícios relacionados. |
| Arquivo físico | Localização, volumes e caixas, quando aplicável. |

A organização poderá usar abas acessíveis ou navegação por seções, conforme volume e testes de uso.

Não colocar todo o cadastro em um único formulário de edição.

### 14.8. Identificação dos dados do BI

- Identificar blocos provenientes do BI.
- Informar última sincronização.
- Apresentar campos de consulta como informação legível, evitando aparência excessivamente apagada.
- Distinguir valores de origem e complementações locais.
- Informar divergências de forma contextual.
- Oferecer atualização manual somente quando autorizada e suportada.
- Não interromper o trabalho com avisos repetitivos de sincronização.
- Exibir aviso persistente quando a indisponibilidade comprometer a atualidade dos dados.

### 14.9. Formulário de atividade

Campos mínimos:

- Processo, já selecionado quando aberto pela ficha.
- Categoria técnica ou administrativa.
- Tipo da atividade.
- Responsável.
- Início.
- Término, quando concluída.
- Descrição/observações.

Campos condicionais:

- Destinatário para consulta ou encaminhamento.
- Dados de publicação.
- Informação de decisão ou recurso.
- Nova situação, quando aplicável.

Comportamentos:

- Exibir somente os campos necessários ao tipo escolhido.
- Informar quais campos são obrigatórios.
- Permitir digitar datas e usar seletor.
- Utilizar rótulos permanentes.
- Mostrar instruções próximas ao campo.
- Preservar os valores preenchidos em caso de erro.
- Exibir resumo de erros e mensagens junto aos campos.
- Informar o efeito da atividade na situação antes de salvar.
- Utilizar ações específicas: “Iniciar atividade” ou “Salvar atividade concluída”.

A conclusão de uma atividade poderá oferecer “Concluir e iniciar próxima”, sem obrigar o usuário a criar uma nova atividade.

### 14.10. Distribuição e redistribuição

Apresentar:

- Processo e responsável atual.
- Unidade/divisão de destino.
- Técnico elegível.
- Data.
- Motivo ou observação.
- Resumo da alteração.

Se houver atividades abertas, informar o que acontecerá com elas. Não transferir automaticamente sua responsabilidade sem regra validada.

Distribuição em lote é uma evolução proposta. Caso implementada:

- Mostrar quantidade e escopo da seleção.
- Diferenciar página atual de todos os resultados.
- Apresentar resumo antes de confirmar.
- Informar sucesso ou falha por processo.
- Respeitar permissões em cada registro.

### 14.11. Histórico e linha do tempo

Cada registro deverá apresentar:

- Tipo de ação.
- Data da ocorrência.
- Responsável.
- Descrição.
- Alteração de situação, quando houver.
- Data de lançamento quando diferente da ocorrência.

Permitir filtrar por:

- Atividades técnicas.
- Atividades administrativas.
- Distribuições.
- Decisões e publicações.
- Encerramentos e reaberturas.

O histórico de negócio deverá ter linguagem compreensível. Logs técnicos da integração ficarão em área administrativa própria.

### 14.12. Uso de páginas, painéis e modais

| Padrão | Uso |
|---|---|
| Página completa | Ficha do processo, relatórios e formulários extensos. |
| Painel lateral | Consulta rápida ou ação curta que precise preservar a lista ao fundo. |
| Modal | Confirmação de encerramento, reabertura ou outra decisão delimitada. |
| Mensagem junto ao campo | Erro ou orientação específica. |
| Aviso persistente | Indisponibilidade ou problema que continue afetando a operação. |
| Mensagem breve de sucesso | Confirmação de salvamento sem exigir nova ação. |

Evitar modais extensos, modais dentro de modais e confirmação para toda ação simples.

Ao fechar um painel ou modal, devolver o foco ao elemento que o abriu.

### 14.13. Padrão visual

- Reutilizar componentes e identidade da aplicação.
- Usar fundo neutro e superfícies de conteúdo bem delimitadas.
- Reservar cor principal para ações e seleção.
- Utilizar cores semânticas de forma consistente.
- Usar texto junto às cores de situação.
- Preferir ícones acompanhados de rótulos em ações importantes.
- Evitar gráficos decorativos, sombras excessivas e excesso de cartões.
- Utilizar escala consistente de espaçamento.
- Adotar tipografia legível; 16 px é uma referência inicial para textos e formulários.
- Oferecer densidade compacta somente se preservar legibilidade e área de interação.
- Alinhar valores numéricos de forma consistente.
- Exibir datas em DD/MM/AAAA, áreas com unidade e valores monetários com moeda.

As dimensões visuais são propostas de design, não regras universais. Deverão ser testadas nas telas e equipamentos utilizados pelas unidades.

### 14.14. Acessibilidade

Objetivo: atender aos critérios aplicáveis da WCAG 2.2 nível AA, mediante verificação.

- Todas as ações devem funcionar por teclado.
- A ordem de foco deve acompanhar a ordem lógica.
- O foco deve ser visível e não ficar totalmente oculto por elementos fixos.
- Campos devem ter rótulos associados.
- Erros devem identificar o problema e orientar a correção.
- Situações não podem ser comunicadas somente por cor.
- Contraste mínimo de texto: 4,5:1; para texto grande, 3:1.
- Componentes e indicadores visuais devem observar o contraste não textual aplicável.
- Alvos de interação devem atender ao mínimo de 24 × 24 CSS px ou às exceções e regras de espaçamento do critério.
- Preferir áreas maiores em ações frequentes e em dispositivos de toque.
- Tabelas devem possuir cabeçalhos semanticamente associados.
- Alterações relevantes devem ser comunicadas às tecnologias assistivas.
- A interface deve suportar ampliação e reorganização do conteúdo.
- Conteúdo essencial não pode depender exclusivamente de tooltip ou hover.
- Tabelas extensas podem ter rolagem própria, preservando a operação do restante da página.

### 14.15. Responsividade

- Priorizar o uso diário em desktop.
- Validar o layout em notebooks de 1366 × 768.
- Reorganizar formulários em coluna única em telas estreitas.
- Recolher a navegação lateral quando necessário.
- Manter acesso às ações essenciais.
- Priorizar colunas da tabela em telas pequenas.
- Disponibilizar detalhes completos na ficha.
- Não reduzir indiscriminadamente o tamanho da fonte para caber conteúdo.
- Evitar cabeçalhos fixos que ocupem espaço excessivo ou ocultem o foco.

### 14.16. Estados da interface

| Estado | Tratamento |
|---|---|
| Carregando | Indicador contextual; impedir apenas ações dependentes. |
| Carteira vazia | Explicar a ausência e apresentar ação permitida. |
| Busca sem resultado | Manter filtros e sugerir revisão. |
| Falha de consulta | Informar erro e oferecer nova tentativa. |
| BI indisponível | Mostrar os dados disponíveis e sua última atualização. |
| Salvamento em andamento | Evitar envio duplicado. |
| Salvamento concluído | Confirmar ação e atualizar o conteúdo pertinente. |
| Validação com erro | Preservar dados e apontar os campos. |
| Conflito de edição | Informar alteração por outro usuário e permitir revisar sem perda silenciosa. |
| Acesso negado | Explicar a restrição sem revelar dados protegidos. |
| Alterações não salvas | Avisar antes de abandonar o formulário. |

### 14.17. Critérios de aceite de UI/UX

| ID | Critério |
|---|---|
| UX-01 | O usuário identifica a unidade e o contexto atuais em todas as telas operacionais. |
| UX-02 | É possível localizar um processo por identificadores e vínculos complementares. |
| UX-03 | Voltar à lista preserva busca, filtros, ordenação e página. |
| UX-04 | É possível registrar atividade sem redigitar os dados básicos do processo. |
| UX-05 | Carteira atribuída e atividades iniciadas são visualmente distintas. |
| UX-06 | Dados do BI e dados operacionais têm origem identificável. |
| UX-07 | Erros preservam o preenchimento e indicam como corrigir. |
| UX-08 | As tarefas essenciais são executáveis por teclado. |
| UX-09 | Cores não são o único meio de identificar situações. |
| UX-10 | Falhas e desatualização da integração são comunicadas sem ocultar os dados disponíveis. |
| UX-11 | Nenhuma informação essencial exige abrir o processo original para consultar dados já existentes no módulo. |
| UX-12 | Encerramento e redistribuição apresentam seus efeitos antes da confirmação. |

### 14.18. Validação com usuários

Antes de consolidar o layout, testar com representantes dos três grupos:

- Gestão.
- Técnicos.
- Equipe administrativa.

Tarefas de teste:

1. Localizar processo por SQL complementar.
2. Verificar responsável e situação.
3. Distribuir processo sem responsável.
4. Iniciar e concluir atividade.
5. Consultar histórico.
6. Encontrar processos sem movimentação.
7. Localizar ofício pendente.
8. Consultar localização física.
9. Retornar à lista sem perder filtros.

Avaliar:

- Conclusão da tarefa.
- Erros e necessidade de ajuda.
- Compreensão dos rótulos.
- Tempo e esforço de execução.
- Operação por teclado.
- Diferenças entre os perfis.

As metas quantitativas serão definidas após a primeira rodada de avaliação.

## 15. Critérios gerais de aceite

1. Incorporar processo do BI sem redigitação.
2. Sincronizar sem duplicação nem sobrescrita operacional.
3. Localizar por qualquer SQL, endereço ou interessado vinculado.
4. Distribuir e redistribuir preservando histórico.
5. Diferenciar carteira e atividade iniciada.
6. Atualizar situação somente pelas regras previstas.
7. Exibir informações consistentes em grupos diferentes.
8. Encerrar e reabrir sem perda do histórico.
9. Restringir consulta e alteração conforme permissões.
10. Produzir relatórios coerentes com filtros e histórico.
11. Identificar falhas e dados desatualizados da integração.
12. Atender aos critérios de UI/UX definidos nesta especificação.

## 16. Definições pendentes

- Tabelas/views e campos do BI.
- Identificador estável do processo.
- Representação de unidade, tramitação, técnico e situação na origem.
- Frequência de atualização do BI e do módulo.
- Responsáveis simultâneos.
- Atividades simultâneas.
- Regras de transferência entre unidades.
- Catálogos oficiais de situações, atividades, decisões e instâncias.
- Campos passíveis de complementação ou correção local.
- Escopo de acesso entre unidades.
- Prazos, vencimentos e notificações.
- Tratamento das atividades administrativas sem vínculo com processo.
- Política de retenção e correção do histórico.

## 17. Sequência proposta de implementação

### Etapa 1 — Estrutura e integração

- Mapear o BI.
- Definir identidade do processo.
- Integrar autenticação e unidades.
- Implementar consulta, incorporação e sincronização.
- Criar cadastro e busca.

### Etapa 2 — Gestão operacional

- Carteira.
- Distribuição e redistribuição.
- Atividades.
- Situações.
- Histórico e auditoria.
- Encerramento e reabertura.

### Etapa 3 — Controles complementares

- Grupos.
- Ofícios.
- Arquivo físico.
- Importação dos controles legados.

### Etapa 4 — Indicadores e refinamento

- Relatórios.
- Exportações.
- Validação de acessibilidade.
- Testes de usabilidade.
- Ajustes de desempenho.
- Evoluções de produtividade aprovadas.

## 18. Referências de UI/UX

As fontes fundamentam padrões de interação e acessibilidade. A arquitetura de telas, o menu e as prioridades apresentados são propostas específicas para este módulo.

- GOV.UK Design System — Tables:
  https://design-system.service.gov.uk/components/table/

- GOV.UK Design System — Error summary:
  https://design-system.service.gov.uk/components/error-summary/

- GOV.UK Design System — Error message:
  https://design-system.service.gov.uk/components/error-message/

- GOV.UK Design System — Notification banner:
  https://design-system.service.gov.uk/components/notification-banner/

- W3C — Web Content Accessibility Guidelines 2.2:
  https://www.w3.org/TR/WCAG22/

- W3C — Understanding WCAG 2.2:
  https://www.w3.org/WAI/WCAG22/Understanding/

- W3C — Focus Not Obscured (Minimum):
  https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum

- W3C — Target Size (Minimum):
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

Referências consultadas em 20/10/2026.