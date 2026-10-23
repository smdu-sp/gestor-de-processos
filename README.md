# Gestão de Processos

Versão inicial em **Next.js full stack + Prisma + TypeScript + MySQL 8.4 no Docker**, baseada nos requisitos e na análise de `servin-controle-main`.

## Executar

Requer Node.js 22, npm e Docker com Compose.

```powershell
npm install
Copy-Item .env.example .env
npm run db:configure
npm run db:up
# Defina SEED_PASSWORD no .env
npm run setup
npm run dev
```

Acesse http://localhost:3000. Administrador: **d000001**. Senha: valor de `SEED_PASSWORD`. O `.env` local já criado usa inicialmente o valor de exemplo. O seed não redefine senhas existentes. `DEMO_MODE=true` cria 12 processos fictícios e técnicos d000002 a d000004. Para operação real, use outro banco vazio com `DEMO_MODE=false`; desligar o aviso não remove exemplos existentes.

## Entrega

### Identidade visual

O padrão visual do projeto é o `outorga-fullstack`: fonte Sora, brasão SMUL, paleta, menu lateral, cartões, campos e tabelas. Os tokens estão em `src/app/globals.css`; os temas Claro, Escuro e Sistema são compartilhados entre o login e as telas internas por `src/components/theme.tsx`. Novas telas devem reutilizar esse padrão.

### Login SMUL

A tela de acesso foi adaptada do `outorga-fullstack`, com os mesmos logos, fotos do Martinelli e temas claro/escuro. `AUTH_MODE=local` dispensa a senha somente quando `NODE_ENV=development` (npm run dev), exigindo usu?rio cadastrado e ativo. Em produ??o, valida a senha cadastrada no banco. Para usar as credenciais de rede, configure `AUTH_MODE=ldap` e `SMUL_AUTH_API_URL` com a base da API SMUL Auth; o servidor chama `POST /auth/ldap/autenticar`. Sem `AUTH_MODE`, `ENVIRONMENT=local` seleciona o modo local e os demais ambientes usam LDAP. Não há fallback de LDAP para senha local.

Usuários de rede novos são cadastrados inativos, com perfil CONSULTA e sem unidades. Um administrador deve ativar o registro em `User` e atribuir as unidades em `Membership` no banco (a gestão de usuários ainda não tem tela). Usuários inativos não entram. As permissões e sessões de 8 horas continuam no banco deste sistema, com cookie HttpOnly exclusivo `gestao-processos.session-token`. Sessões anteriores precisam de novo login. Nenhum usuário ou senha do banco de origem foi importado.


- Login com cookie HttpOnly, perfis e restrições por unidade no servidor.
- Dashboard, carteira paginada, filtros, busca por vínculos e CSV.
- Cadastro, distribuição/redistribuição, atividades, conclusão, situação, encerramento/reabertura e histórico transacional.
- Produção por técnico/unidade/período com autoria histórica preservada.
- Grupos, cadastro/andamento de ofícios e localização física histórica.
- Conectores de leitura BI/SEI com contratos normalizados, idempotência, rollback, logs e trava de execução.

**SEI:** WSDL da Prefeitura obtido e contrato conferido; configuração de sistema/serviço/unidade ainda necessária. **BI:** SQL Server inspecionado; schema real com 1 tabela e 35 views em `prisma/bi/schema.prisma`, separado do banco operacional. Veja [análise do BI](docs/bi-schema.md). A importação depende do recorte da carteira e do mapeamento de unidades. Não há escrita nas fontes.

Planejamento e limites: [plano do sistema](docs/plano-do-sistema.md). Configuração e exemplos: [integrações](docs/integracoes.md). Especificação: [requisitos](docs/requisitos.md).

## Verificações

```powershell
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm start
```

Testes de negócio criam um banco MySQL temporário isolado no contêiner local e o removem ao terminar; execute `npm run db:up` antes de `npm test`. Navegador usa o seed demonstrativo. `npm run sync` pode ser chamado pelo agendador do servidor. Segredos ficam no `.env`, nunca em `NEXT_PUBLIC`.

O banco operacional é `gestao_processos`, disponível em `127.0.0.1:3307`, com usuário `gestao`. Senhas aleatórias são geradas por `db:configure` e gravadas no `.env`, inclusive a URL do Prisma. O MySQL usa volume persistente `mysql_data`, UTF-8 completo e horário UTC. `npm run db:down` para os contêineres e preserva o volume; `npm run db:up` inicia novamente. A inicialização das credenciais pelo Docker ocorre somente com volume vazio; alterar a senha no `.env` não altera contas de um banco existente.

O schema operacional está em `prisma/schema.prisma`; as migrações atuais são MySQL. O schema e as migrações anteriores foram arquivados em `prisma/legacy-sqlite`, e o arquivo SQLite anterior foi preservado. Dados antigos não são transferidos automaticamente; o seed inicializa a nova base. O banco externo do BI permanece SQL Server em `BI_DATABASE_URL`.

Pendências: SSO, gestão de usuários/catálogos, hierarquia formal coordenadoria/divisão, cadastro urbanístico completo, decisões/recursos, importação legada com prévia e permanência histórica por situação. Listagens auxiliares mostram até 100 registros. Rate limit de login é em memória por instância. Produção exige HTTPS, backup e revisão dos controles operacionais.

No volume Windows deste workspace, junctions falham e readlink retorna EISDIR em arquivos comuns. Os scripts Next usam Webpack e adaptador Windows que normaliza somente esse caso, confirmando antes que não é link. Linux/macOS não carregam o adaptador. Prisma 6.19.3 mantém compatibilidade com o Node instalado; override de deepmerge-ts corrige dependência vulnerável e foi validado com migrações/geração.
