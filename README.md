# Formulário do Cyber War Games

Aplicação Node/Express com identidade própria do CWG. O formulário registra e-mail e idade em um banco PostgreSQL. A tabela `cwg_responses` é criada automaticamente ao iniciar a aplicação com `DATABASE_URL` configurada. Um novo envio para o mesmo e-mail atualiza a idade e o horário da última resposta.

## Executar

1. Instale Node.js 20 ou posterior.
2. Crie um banco PostgreSQL e copie `.env.example` para `.env`.
3. Defina `DATABASE_URL` no ambiente do terminal ou carregue o arquivo `.env` com a ferramenta de sua preferência.
4. Na pasta do projeto, execute `npm install`.
5. Execute `npm start`.
6. Abra `http://localhost:3000`.

O servidor usa a variável `PORT` quando definida. A rota `GET /saude` verifica também a conexão com o banco. Sem `DATABASE_URL`, a interface abre localmente, mas o envio responde como indisponível.

## Publicar no Render

O arquivo `render.yaml` na raiz do repositório define o Web Service e o Render Postgres. No painel do Render:

1. Conecte o repositório Git.
2. Crie um Blueprint usando o `render.yaml`.
3. Confirme a criação do serviço `cwg-formulario` e do banco `cwg-formulario-db`.
4. Aguarde o health check `/saude` ficar saudável.

O Blueprint fornece a conexão interna do banco ao serviço pela variável `DATABASE_URL`; nenhuma senha deve ser adicionada ao repositório.

## Dados armazenados

A aplicação armazena somente e-mail, idade e datas de criação/atualização. Não registra senha, IP ou User-Agent. Defina a retenção e o acesso às respostas conforme as regras do exercício.
