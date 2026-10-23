# Schema do BI SQL Server

Inspeção somente de leitura em 23/10/2026, usando `BI_DATABASE_URL`. A confiança no certificado foi autorizada exclusivamente para esta inspeção e aplicada apenas ao processo temporário. A URL no `.env` não foi alterada. A conexão permaneceu criptografada.

## Artefatos

- `prisma/bi/schema.prisma`: schema Prisma introspectado, separado do schema operacional SQLite. Contém 1 model e 35 views com os tipos reais, nulabilidade, precisão e tamanho das colunas.
- `docs/bi-inspecao.json`: catálogo de objetos/colunas e estatísticas agregadas, sem amostras de nomes, documentos ou endereços.
- `scripts/inspect-bi.cjs`: consultas SELECT de metadados e perfil. Valida certificado por padrão; a opção `--trust-server-certificate` deve ser usada apenas quando autorizada para a inspeção.

Não executar `migrate`, `db push`, DDL ou seed contra esse schema. A tabela bruta não possui identificador único declarado e foi marcada `@@ignore` pelo Prisma. As views não receberam chaves ou relações inventadas.

## Estrutura principal

| Objeto | Finalidade observada pelos campos | Correspondência sugerida |
|---|---|---|
| Processos / prata_processo | Sistema, número, autuação, situação e tipo | Cadastro central de processos |
| Assuntos / prata_assunto | Pedidos, assuntos, protocolo, situação, documentos e distrito | Múltiplos pedidos/assuntos por processo |
| Interessados / prata_interessado | Pessoas e atribuições por assunto | Interessados vinculados |
| Enderecos / prata_endereco | Logradouro, número, complemento, bairro e CEP | Endereços múltiplos |
| Cadastros / prata_sql_incra | SQL/INCRA por assunto | Imóveis/cadastros múltiplos |
| ComuniqueSes / prata_comuniqueSe | Comunicações e datas | Eventos externos de BI, não produção automática |
| Despachos / prata_despacho | Decisões e documentos | Histórico de decisões, sujeito à validação de regras |
| QuadroAreas, QuadroAreasUso, Categorias, Zonas_Usos | Dados de licenciamento | Complemento urbanístico |
| SQLsCondominio, SQLsFiliacao | Relações entre cadastros | Imóveis relacionados |
| AssuntosReferenciados | Referências entre assuntos/processos | Vínculos de processos |

Nomes e semântica são inferidos dos campos; as definições SQL das views retornaram nulo para esta credencial. Não foi possível confirmar transformações internas, filtros ou estabilidade de IDs gerados pelas views.

## Chaves e cardinalidade

- `dbo.Processos`: 1.407.971 linhas; 1.407.971 combinações distintas de `Sistema + Processo`; nenhuma dessas duas colunas nula na inspeção.
- `id_processo` também é único no snapshot consultado, mas sua estabilidade entre cargas não está comprovada. Não adotá-lo como identidade externa definitiva sem confirmação.
- `Interessados`, `Enderecos`, `Cadastros` e outros expõem `id_assunto`. Relação lógica sugerida com `Assuntos.id_assunto`; não é uma FK declarada/introspectada. A estabilidade desses IDs também exige confirmação.
- Para vinculação entre entidades, preservar sempre `Sistema` e `Processo` e avaliar também protocolo/código do pedido. Não unir apenas pelo número sem verificar colisões entre sistemas.
- `bronze_sd0261_T10345_CONS_OLHO_OBRA`: 373.281 linhas e 120.369 combinações dos componentes de número, sem componentes nulos. É uma fonte com múltiplas linhas por processo, sem chave primária. O perfil bruto não substitui o perfil das views.
- A tabela bruta contém códigos de sistema 2 e 3. Não se inferiu qual corresponde a SEI/AD sem catálogo oficial.

## Datas e origem

`Processos` expõe autuação, não data de atualização. `prata_processo` expõe `dtcarga` e `dt_inclusao`; essas datas não comprovam atualização no sistema original. Não convertê-las automaticamente em `sourceUpdatedAt`.

Na tabela bruta, o máximo observado de `DT_ATLZ` é 30/08/2025. Essa observação pertence apenas à tabela bruta; não permite concluir a atualidade de todas as views. Datas agregadas do driver são serializadas em ISO no relatório, sem confirmação do fuso da origem.

## Importação operacional

A importação permanece desabilitada: a view Processos abrange aproximadamente 1,4 milhão de registros, sem campo de coordenadoria/unidade encontrado nessa view. É necessário definir quais processos integram a carteira e como atribuir a unidade inicial. Não será importado todo o BI nem marcada ausência a partir de consulta parcial.

O próximo adaptador deverá selecionar colunas específicas, usar paginação/recorte determinístico, carregar relações separadamente para evitar produto cartesiano e preservar complementos locais. A chave estável deverá contemplar o sistema; o atual número único no cadastro operacional precisa ser revisado se existirem números coincidentes entre sistemas.

O banco BI permanece separado do banco operacional Prisma. O schema externo é um retrato para leitura e documentação, não uma proposta de alteração da base de origem.
