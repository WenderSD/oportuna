# Integração com a API de oportunidades

## Ambiente e autenticação

Frontend local: `http://localhost:5173`. API local: `http://localhost:3000/api`.
O frontend pode usar `VITE_API_URL=http://localhost:3000/api` no seu ambiente.
Essa variável contém somente o endereço público da API. `DATABASE_URL` e `JWT_SECRET` pertencem exclusivamente ao backend.

Todas as rotas de oportunidades exigem `Authorization: Bearer <token>`.
Obtenha o token em `POST /api/usuarios/login`, enviando `email` e `senha`.
A resposta contém `mensagem`, `usuario` (id, nome, email, papel e criadoEm) e `token`.
O cadastro é feito em `POST /api/usuarios` com `nome`, `email` e `senha`.
`GET /api/usuarios/me` retorna `{ "usuario": { ... } }` e pode ser usado na saudação e no perfil.

## Rotas

| Método | Caminho após /api | Resultado |
| --- | --- | --- |
| POST | /oportunidades | Publica e retorna HTTP 201 |
| GET | /oportunidades | Lista somente ativas, com filtros e paginação |
| GET | /oportunidades/:id | Consulta detalhes, inclusive de expiradas e encerradas |
| GET | /usuarios/me/oportunidades | Lista somente publicações do usuário autenticado, em todos os estados |
| PATCH | /oportunidades/:id | Edita campos permitidos, somente pelo autor |
| PATCH | /oportunidades/:id/encerrar | Encerra, somente pelo autor; corpo ausente ou `{}` |

O papel ADMINISTRADOR não concede uma exceção à autoria neste módulo.
Não há exclusão definitiva nem reabertura de publicações encerradas.

## Publicação e edição

Exemplo de corpo para publicação:

```json
{
  "titulo": "Estágio em desenvolvimento",
  "empresa": "Empresa Exemplo",
  "tipo": "ESTAGIO",
  "modalidade": "REMOTO",
  "descricao": "Desenvolvimento de aplicações para a comunidade acadêmica.",
  "requisitos": ["Estar cursando ensino superior"],
  "linkCandidatura": "https://example.com/candidatura",
  "emailContato": "vagas@example.com"
}
```

| Campo | Obrigatório na criação | Regra |
| --- | --- | --- |
| titulo | Sim | Texto sem espaços nas extremidades, 3 a 150 caracteres |
| empresa | Sim | Texto sem espaços nas extremidades, 2 a 150 caracteres |
| descricao | Sim | Texto sem espaços nas extremidades, 10 a 10000 caracteres |
|"renda": "Bolsa-auxílio de R$ 1.200,00"|
| tipo | Sim | EMPREGO, ESTAGIO, PESQUISA ou OUTRO |
| modalidade | Sim | PRESENCIAL, HIBRIDO ou REMOTO |
| localizacao | Não | Texto de 2 a 150 caracteres ou null |
| renda | Não | Texto livre de 2 a 100 caracteres, como "R$ 1.500,00", "Bolsa-auxílio de R$ 1.200,00" ou "A combinar"; ou null |
| requisitos | Não | Até 30 textos de 1 a 500 caracteres cada; padrão [] |
| linkCandidatura | Não | URL absoluta HTTP/HTTPS de até 2048 caracteres ou null |
| emailContato | Não | Email válido de até 254 caracteres ou null; salvo em minúsculas |
| expiraEm | Não | Data futura ISO 8601 com fuso, por exemplo 2099-12-01T23:59:59-03:00, ou null |

Título, empresa, descrição e requisitos são texto, não HTML.
`OUTRO` também é o valor atribuído pela migration às publicações antigas, preservando seus dados.
Campos opcionais ausentes retornam null, exceto requisitos, que retorna uma lista.
Não envie string vazia para representar ausência; omita o campo ou envie null quando permitido.

A edição usa os mesmos campos, todos opcionais, exigindo pelo menos um.
Enviar null remove um campo opcional; enviar [] limpa os requisitos; omitir mantém o valor existente.
O autor pode renovar o prazo de uma oportunidade expirada informando uma data futura ou null.
Uma publicação encerrada não pode ser editada nem reaberta.

Não envie `id`, `autorId`, `estado`, `criadoEm`, `atualizadoEm` ou `encerradaEm`.
Campos desconhecidos são rejeitados; a autoria vem do token e as datas são controladas pela API.
O corpo JSON tem limite de 100 KB.

Criação, edição, encerramento e detalhes retornam um objeto `oportunidade`:

```json
{
  "oportunidade": {
    "id": "00000000-0000-4000-8000-000000000101",
    "titulo": "Estágio em desenvolvimento",
    "descricao": "Desenvolvimento de aplicações para a comunidade acadêmica.",
    "empresa": "Empresa Exemplo",
    "tipo": "ESTAGIO",
    "modalidade": "REMOTO",
    "localizacao": null,
    "requisitos": ["Estar cursando ensino superior"],
    "linkCandidatura": "https://example.com/candidatura",
    "emailContato": "vagas@example.com",
    "expiraEm": null,
    "encerradaEm": null,
    "criadoEm": "2026-11-15T12:00:00.000Z",
    "atualizadoEm": "2026-11-15T12:00:00.000Z",
    "autorId": "00000000-0000-4000-8000-000000000001",
    "estado": "ATIVA"
  }
}
```

As operações de escrita incluem também `mensagem`. Não há dados de cadastro do autor na oportunidade.

## Filtros e paginação

`GET /api/oportunidades?busca=desenvolvimento&tipo=ESTAGIO&modalidade=REMOTO&pagina=1&limite=10`

- tipo e modalidade são opcionais; quando combinados, ambos precisam ser atendidos.
- pagina é um inteiro entre 1 e 10000; padrão 1.
- limite é um inteiro entre 1 e 50; padrão 10.
- A ordenação é por criadoEm decrescente, com id decrescente para desempate.
- Não há busca livre. Parâmetros como busca, texto e empresa, valores desconhecidos ou parâmetros repetidos retornam 400.
- Para recentes, use a mesma listagem com um limite menor. A paginação permite percorrer as demais oportunidades.

As duas rotas de listagem retornam:

```json
{
  "oportunidades": [],
  "paginacao": {
    "pagina": 1,
    "limite": 10,
    "total": 0,
    "totalPaginas": 0
  }
}
```

A lista contém objetos completos de oportunidade. Uma página sem resultados retorna [] com HTTP 200.
O total usa os mesmos filtros da listagem. Atualizações entre duas requisições podem mudar a distribuição das páginas.

Em `/api/usuarios/me/oportunidades`, também é permitido `estado=ATIVA`, `EXPIRADA` ou `ENCERRADA`.
Sem estado, essa rota inclui todos os estados. Não aceita autorId nem permite consultar publicações privadas de outro perfil.

## Disponibilidade e interface

- ENCERRADA: encerradaEm preenchido. Tem precedência sobre a expiração.
- EXPIRADA: sem encerramento, com expiraEm anterior ou igual ao instante atual.
- ATIVA: sem encerramento, com prazo futuro ou sem prazo.

O estado é calculado no servidor; não depende de cron. Use o campo estado retornado, sem recalculá-lo no navegador.
Ao encerrar novamente, a API retorna HTTP 200 e preserva a data do primeiro encerramento.
O catálogo exclui expiradas e encerradas, mas os detalhes continuam acessíveis a usuários autenticados para permitir informar a indisponibilidade.

No frontend:

1. Use seletores e sugestões com os valores fechados documentados; os rótulos podem ser traduzidos (ESTAGIO → Estágio).
2. Exiba Candidatar-se apenas se a oportunidade estiver ATIVA e possuir linkCandidatura.
3. Exiba Entrar em contato apenas se estiver ATIVA e possuir emailContato; o frontend pode abrir um link mailto.
4. Se não houver canal de candidatura, informe isso ao usuário. Os dois canais são opcionais no modelo atual.
5. Ofereça gerenciamento quando autorId corresponder ao usuário do /me. A API sempre confere a autorização novamente.
6. Em 401, solicite novo login. Em 403, informe falta de permissão; em 409, atualize os detalhes antes de oferecer outra ação.
7. Mostre carregamento, lista vazia e erro como estados distintos. Reinicie pagina em 1 quando um filtro mudar.

## Erros

| HTTP | Significado |
| --- | --- |
| 400 | Campos, filtros ou UUID inválidos; JSON malformado |
| 401 | Token ausente, inválido, expirado ou identidade inválida |
| 403 | Tentativa de gerenciar publicação alheia |
| 404 | Oportunidade ou rota inexistente |
| 409 | Tentativa de editar uma oportunidade encerrada |
| 413 | Corpo maior que 100 KB |
| 500 | Falha inesperada; resposta sem detalhes internos |

As mensagens de validação são retornadas em português. Exemplo de estrutura:

```json
{
  "mensagem": "Dados da requisição inválidos.",
  "erros": [{ "campo": "titulo", "mensagem": "Mensagem de validação do campo." }]
}
```

Erros gerais retornam somente `mensagem`. `campo` pode ser vazio em erros referentes ao objeto inteiro.
O frontend deve usar o status e o campo; não depender da redação exata da mensagem para controlar o fluxo.

## Demonstração e testes

Siga o README para migrations e dados fictícios. Requisições prontas estão em `Backend/oportunidades.http`.
A conta local de demonstração é `demo@example.test`, senha `Demo-oportuna-123`.
Esses dados são exclusivamente fictícios e não devem ser usados em um ambiente publicado.
Use um banco de desenvolvimento para testes manuais; `npm test` exige um PostgreSQL local separado com nome terminado em `_test`.
O seed não faz parte dos testes automatizados. A suíte cria e remove somente suas próprias contas e publicações.
