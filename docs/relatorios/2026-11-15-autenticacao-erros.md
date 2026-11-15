# Validação de autenticação e consistência dos erros

Data: 15/11/2026

Responsável: Pedro Henrique — [drexsi0](https://github.com/drexsi0)

## Problema e correção

Foi reproduzida uma disputa entre quatro cadastros simultâneos com o mesmo email: a versão anterior retornou um HTTP 201 e três HTTP 500. A consulta prévia não garantia unicidade no instante da gravação.

O cadastro agora utiliza a restrição única do PostgreSQL como garantia e trata o erro P2002 do Prisma dentro do serviço de usuários. O resultado é um HTTP 201 e três HTTP 409, preservando a mensagem existente: Este e-mail já está cadastrado. Outros erros continuam sendo propagados para o tratamento centralizado.

Acrescentada validação antes da abertura da porta: URL PostgreSQL, chave JWT não vazia, duração positiva do token e porta válida. Os erros identificam a variável sem revelar os valores secretos. Essa checagem valida formato/configuração; não comprova a disponibilidade do banco.

## Testes e evidências

- 14 testes de autenticação: normalização, hash, papel padrão, duplicidade simples e concorrente, entradas inválidas, credenciais incorretas, emissão de token e perfil.
- 13 testes de configuração: valores válidos/padrões, variáveis inválidas e inicialização interrompida por chave vazia antes de abrir a API.
- 44 testes de oportunidades mantidos e aprovados.
- Total local: 71 aprovados, zero falhas e zero ignorados.
- Lint, verificação de tipos e build aprovados.
- A regressão de concorrência foi executada antes e depois da correção em PostgreSQL real, sem mocks do banco.

Validação local em Windows, Node.js 22.17.0 e PostgreSQL 16.14 temporário, exclusivo de desenvolvimento/testes. O executor continua usando apenas TEST_DATABASE_URL com as barreiras de isolamento já existentes. A suíte remove somente as contas e publicações criadas pelos próprios testes.

O GitHub Actions executa as três suítes no mesmo workflow de qualidade e integração com PostgreSQL. O resultado remoto pode ser consultado nos checks do PR.

## Contrato e escopo

Não foram alterados endpoints, campos ou formatos de resposta. Cadastro duplicado mantém HTTP 409, erros de entrada mantêm HTTP 400, credenciais inválidas mantêm HTTP 401 e perfil inexistente mantém HTTP 404. A correção cobre o caso concorrente que antes escapava como falha interna.

Não há migrations, novas dependências, alterações no frontend, deploy ou mudança das regras de aprovação. O README descreve a validação adicional da configuração. A disponibilidade do banco e a experiência no navegador não são garantidas por esta entrega.

## Próximo passo

Revisar o PR e integrar quando conveniente. O frontend pode continuar utilizando o contrato já documentado; esta alteração não exige adaptação nas telas. Em outra entrega, preparar e verificar a exportação/restauração do banco com dados fictícios.
