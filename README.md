# Meta Ads Analytics AI — base inicial

## Executar
1. Instale Node.js 20+ e PostgreSQL.
2. `cp .env.example .env` e configure `DATABASE_URL`.
3. `npm install`
4. `npx prisma db push`
5. `npm run dev`
6. Abra `http://localhost:3000`.

## Estado real de implementação
- **Implementado:** dashboard interativo com cálculos de ROAS, ROI, CAC, CPA e lucro; schema Prisma para usuários, organizações, contas, campanhas e métricas diárias.
- **Ainda não implementado:** login/sessões, OAuth Meta, ingestão automática, relatórios e análise por LLM. O schema de usuários não constitui autenticação funcional.
- **Segurança:** tokens OAuth devem ficar criptografados no backend; verificar assinatura/state, permissões, rotação e revogação; segredos nunca no frontend.
- **Dados:** receita atribuída do Meta pode divergir de receita confirmada; CAC exige clientes novos reais; ROI considera custos adicionais inseridos; para precisão financeira reconciliar vendas e devoluções.
- **Próximas etapas:** autenticação, organização/RBAC, OAuth oficial Meta, jobs de sincronização com paginação e rate limits, persistência, IA com evidências e auditoria.

Esta é uma base executável, não uma integração pronta para produção.
