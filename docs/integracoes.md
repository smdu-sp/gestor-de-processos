# Integrações BI e SEI

O SEI foi adaptado ao [manual Web Services 4.1 fornecido](SEI-WebServices-v4.1.pdf). O BI foi confirmado como **banco de dados com acesso direto**, sem API HTTP. Os JSONs abaixo são contratos internos entre adaptadores e persistência, não respostas esperadas de uma API REST.

## Transporte

### SEI: SOAP / WSDL

Configure no `.env`, conforme `.env.example`:

- `SEI_WSDL_URL`: URL da instalação, normalmente `https://servidor/sei/controlador_ws.php?servico=sei` (manual, p. 5).
- `SEI_SIGLA_SISTEMA`: sistema cadastrado pela administração SEI.
- `SEI_IDENTIFICACAO_SERVICO`: identificação/chave liberada para o serviço, somente no servidor. A introdução (pp. 6–8) cita o parâmetro `Identificacao`, enquanto as tabelas das operações (pp. 28 e 35) usam `IdentificacaoServico`. O adaptador segue as tabelas; confirmar o nome no WSDL da instalação antes da homologação.
- `SEI_ID_UNIDADE`: ID autorizado da unidade que faz a consulta. Nesta versão é único para a integração; não confundir com a distribuição operacional local.
- `SEI_ENDPOINT_URL`: opcional; por padrão respeita o endpoint publicado no WSDL. Override deve ter a mesma origem do WSDL.
- `SEI_UTC_OFFSET`: offset das datas sem fuso retornadas pela origem, inicialmente `-03:00`. Confirmar com a instalação. Para histórico de horário de verão ou fuso variável, implementar conversão IANA antes de importar esses períodos.
- `SEI_TAREFAS` / `SEI_TAREFAS_MODULOS`: IDs oficiais separados por vírgula, opcionais. Não há códigos presumidos.

O cliente [node-soap](https://github.com/vpulim/node-soap) lê o WSDL e serializa SOAP. Timeout de 30 segundos por chamada; HTTPS (localhost HTTP apenas em desenvolvimento); respostas SOAP brutas e faults não são gravados nos logs pois podem conter identificação de acesso. O serviço cadastrado no SEI deve autorizar apenas as operações de consulta utilizadas.

`consultarProcedimento` (p. 28) solicita geração, conclusão, último andamento e unidades abertas, sem carregar interessados/assuntos/observações. Não existe campo genérico `status` no retorno (pp. 18–19): o resumo local é derivado das unidades abertas e da presença de andamento de conclusão, sem encerrar o acompanhamento.

`listarAndamentos` (p. 35) exige Andamentos, Tarefas ou TarefasModulos. Só é chamado com tarefas configuradas. Sem filtros, o histórico contém apenas os marcos/último andamento recuperados pela consulta; **não representa o histórico completo**. Mesmo com filtros, a cobertura depende das tarefas selecionadas. IDs longos permanecem strings; datas brasileiras são validadas. `IdAndamento` mantém a deduplicação, e autoria externa é informativa, nunca atribuída automaticamente a um técnico local.

Somente processos locais com `system=SEI` são consultados, inclusive encerrados para observar novas movimentações. Processos AD com número SEI relacionado dependem de um vínculo de identificação ainda não modelado. Processos sigilosos não são retornados pelo método, segundo a p. 28. Não tentar contornar a restrição. Erro em qualquer consulta impede a aplicação do lote.

### BI: conexão direta ao banco

O SQL Server em `BI_DATABASE_URL` foi inspecionado em modo somente leitura. O schema real, com 1 tabela e 35 views, está em `prisma/bi/schema.prisma`; veja [análise e mapeamento](bi-schema.md). O cliente externo pode ser gerado com `npm run bi:generate`. A conexão externa permanece separada de `DATABASE_URL`, exclusiva do Prisma operacional.

A importação em `src/lib/sources/bi.ts` continua desabilitada até definir o recorte da carteira e as unidades iniciais: `Processos` contém 1.407.971 registros e não expõe unidade de distribuição. A inspeção temporária com confiança no certificado foi autorizada pelo usuário; essa opção não foi persistida na URL nem habilitada por padrão no script de inspeção.

Solicitar: SGBD/versão, views/tabelas, chave estável, coluna do número, unidade, assunto e atualização, vínculos de imóveis/interessados e escopo completo. Usar conta com SELECT apenas nas views autorizadas, pool limitado, timeout, parâmetros e leitura consistente. Não executar migrações Prisma no banco BI. A escolha do driver e formato de credencial virá após identificar o SGBD; nenhuma credencial deve ser enviada no chat.

## BI — snapshot completo

```json
{
  "complete": true,
  "processes": [{
    "id": "identificador-estavel-123",
    "number": "6068.2026/0000001-0",
    "subject": "Alvará de aprovação e execução",
    "unitCode": "SERVIN",
    "status": "Em tramitação",
    "updatedAt": "2026-10-20T14:30:00-03:00",
    "properties": [{"identifier":"123.456.7890-1","address":"Endereço do processo"}],
    "parties": [{"name":"Interessado","role":"Requerente"}]
  }]
}
```

O snapshot deve conter **todo o universo integrado**, nunca só uma página/unidade. Confirmar `complete: true` após reunir todas as páginas. Snapshot vazio completo sinaliza todos os vinculados como ausentes, sem excluir/encerrar.

Unidade precisa estar cadastrada. Novos processos entram na unidade indicada; existentes mantêm unidade operacional e recebem unidade externa em campo separado. Identidade duplicada, unidade desconhecida e conflito revertem todo o lote. Vínculos BI são substituídos; vínculos locais são preservados. `updatedAt` ausente permanece nulo.

## SEI — status e eventos

```json
{
  "processes": [{
    "number": "6068.2026/0000001-0",
    "status": "Recebido na unidade",
    "events": [{
      "id": "evento-estavel-789",
      "description": "Processo recebido na unidade de licenciamento",
      "occurredAt": "2026-10-21T10:15:00-03:00",
      "author": "Unidade de origem"
    }]
  }]
}
```

Processo deve existir no módulo. Deduplicação por número + ID externo. Eventos preservam ocorrência e autoria, sem criar produção. Conteúdo/data/autor divergentes de evento importado geram conflito; não apagam histórico. Sem eventos disponíveis, usar `events: []`: status será observado na data da consulta, sem inventar ocorrência passada.

## Operação

`npm run sync -- SEI` executa apenas o SEI; `npm run sync -- BI` apenas o BI. Sem argumento tenta ambas as fontes, independentemente de falha na anterior, e retorna código de falha se qualquer uma falhar. Assim o BI pendente não bloqueia o SEI configurado. `/integracoes` apresenta logs e acionamento manual.

Trava no banco impede concorrência. Se o processo for interrompido, confirmar ausência de worker ativo e remover somente a entrada `integrations` de `SyncLock` via Prisma Studio. Não há expiração automática que possa permitir dois workers ativos.

Cada fonte possui transação própria. Sucesso BI não é revertido por falha posterior SEI. Limites: snapshot em memória, transação de 60 segundos e sincronização manual no ciclo HTTP. Grande volume exige staging, fila persistente e checkpoint; ausência só pode ser avaliada após todas as páginas.

Para homologar: WSDL/endpoint real, autorização SEI, IDs oficiais de tarefas, respostas anonimizadas (inclusive arrays vazios/únicos, SOAP Fault e acentuação), fuso histórico, formato canônico e organograma. Para o BI: SGBD e mapeamento das views. Não foi efetuada conexão externa nesta implementação.
