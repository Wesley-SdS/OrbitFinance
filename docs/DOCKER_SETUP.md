# 🐳 Docker Setup - OrbiFinance MVP

## 📋 Serviços no Docker

O OrbiFinance MVP utiliza 3 serviços Docker:

1. **PostgreSQL** (porta 5432) - Banco de dados principal
2. **Redis** (porta 6379) - Job queue para lembretes
3. **Evolution API** (porta 8080) - API do WhatsApp

---

## 🚀 Iniciar Todos os Serviços

### 1. Certifique-se de que o Docker Desktop está rodando

**Windows**: Abra o Docker Desktop

**Mac**: Abra o Docker Desktop

**Linux**:
```bash
sudo systemctl start docker
```

### 2. Inicie os containers

```bash
# No diretório raiz do projeto
docker-compose up -d
```

Isso irá:
- ✅ Baixar as imagens (primeira vez)
- ✅ Criar e iniciar os 3 containers
- ✅ Configurar a rede entre eles

### 3. Verifique se os containers estão rodando

```bash
docker-compose ps
```

**Saída esperada:**
```
NAME                          IMAGE                           STATUS    PORTS
orbifinance-postgres          postgres:15-alpine              Up        0.0.0.0:5432->5432/tcp
orbifinance-redis             redis:7-alpine                  Up        0.0.0.0:6379->6379/tcp
orbifinance-evolution-api     atendai/evolution-api:latest    Up        0.0.0.0:8080->8080/tcp
```

---

## 🧪 Testar os Serviços

### PostgreSQL

```bash
# Testar conexão
docker exec -it orbifinance-postgres psql -U postgres -d orbifinance_dev -c "SELECT version();"
```

### Redis

```bash
# Testar conexão
docker exec -it orbifinance-redis redis-cli ping
# Deve retornar: PONG
```

### Evolution API

```bash
# Testar se está respondendo
curl http://localhost:8080

# Verificar manager
curl http://localhost:8080/manager
```

Ou abra no navegador: `http://localhost:8080/manager`

---

## 📱 Conectar WhatsApp via Evolution API

### Passo 1: Acessar o Manager

Abra no navegador: `http://localhost:8080/manager`

### Passo 2: Criar Instância

1. Clique em **"Create Instance"**
2. Preencha:
   - **Instance Name**: `orbifinance`
   - **API Key**: `orbifinance-evolution-api-key-2025`
   - **Webhook URL**: `http://host.docker.internal:3000/api/webhooks/whatsapp`
   - Marque todos os eventos de mensagem

3. Clique em **"Create"**

### Passo 3: Conectar WhatsApp

1. Após criar, você verá um **QR Code**
2. Abra o WhatsApp no celular
3. Vá em **Configurações > Aparelhos Conectados**
4. Clique em **"Conectar um aparelho"**
5. Escaneie o QR Code

**Pronto!** Seu WhatsApp está conectado via Evolution API!

---

## 🔧 Comandos Úteis

### Ver logs dos containers

```bash
# Todos os containers
docker-compose logs -f

# Apenas PostgreSQL
docker-compose logs -f postgres

# Apenas Redis
docker-compose logs -f redis

# Apenas Evolution API
docker-compose logs -f evolution-api
```

### Parar os containers

```bash
docker-compose stop
```

### Iniciar novamente

```bash
docker-compose start
```

### Parar e remover (CUIDADO: apaga dados)

```bash
docker-compose down

# Para manter os volumes (dados):
docker-compose down --volumes=false
```

### Reiniciar um container específico

```bash
docker-compose restart postgres
docker-compose restart redis
docker-compose restart evolution-api
```

### Acessar shell do container

```bash
# PostgreSQL
docker exec -it orbifinance-postgres psql -U postgres -d orbifinance_dev

# Redis
docker exec -it orbifinance-redis redis-cli

# Evolution API (shell bash)
docker exec -it orbifinance-evolution-api sh
```

---

## 🔍 Verificar Configuração da Evolution API

### Ver instâncias criadas

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: orbifinance-evolution-api-key-2025"
```

### Ver status da instância

```bash
curl -X GET http://localhost:8080/instance/connectionState/orbifinance \
  -H "apikey: orbifinance-evolution-api-key-2025"
```

### Ver QR Code (se não conectado)

```bash
curl -X GET http://localhost:8080/instance/connect/orbifinance \
  -H "apikey: orbifinance-evolution-api-key-2025"
```

---

## 🛠️ Setup do Banco de Dados

Após os containers subirem, configure o banco:

```bash
# Rodar migrations
npx prisma migrate dev

# Rodar seed (criar categorias padrão)
npx prisma db seed

# Abrir Prisma Studio
npx prisma studio
```

---

## 🧪 Testar WhatsApp Completo

### 1. Certifique-se de que tudo está rodando

```bash
# Containers
docker-compose ps

# Servidor Next.js
pnpm dev
```

### 2. Criar usuário de teste

Via Prisma Studio (`npx prisma studio`):

1. Vá em **User**
2. Crie um usuário:
   - **name**: Test User
   - **email**: test@example.com
   - **phone**: `5511999999999` (seu número de WhatsApp com DDI)

### 3. Criar conta financeira para o usuário

Via Prisma Studio:

1. Vá em **FinancialAccount**
2. Crie uma conta:
   - **name**: Conta Principal
   - **type**: checking
   - **balance**: 1000
   - **currency**: BRL
   - **userId**: (ID do usuário criado)

### 4. Enviar mensagem de teste

Envie uma mensagem pelo WhatsApp conectado:

```
gastei 50 no mercado #alimentacao
```

### 5. Verificar resultado

**No Prisma Studio**:
- Vá em **Transaction**
- Deve aparecer a transação criada

**Nos logs**:
```bash
# Ver logs do servidor Next.js
# Deve mostrar: [WhatsApp] Message received...
```

---

## 📊 Estrutura de Dados da Evolution API

A Evolution API salva dados no mesmo banco PostgreSQL (schema `evolution`):

```
orbifinance_dev
├── public (schema) - OrbiFinance tables
│   ├── User
│   ├── Transaction
│   ├── FinancialAccount
│   └── ...
└── evolution (schema) - Evolution API tables
    ├── Instance
    ├── Message
    ├── Contact
    └── Chat
```

---

## ⚠️ Troubleshooting

### Docker não inicia

**Problema**: `error during connect: open //./pipe/dockerDesktopLinuxEngine`

**Solução**: Inicie o Docker Desktop

---

### Evolution API não sobe

**Problema**: Container fica reiniciando

**Solução**:
1. Ver logs:
   ```bash
   docker-compose logs evolution-api
   ```

2. Verificar se PostgreSQL está rodando:
   ```bash
   docker-compose ps postgres
   ```

---

### WhatsApp não conecta

**Problema**: QR Code não aparece ou expira

**Solução**:
1. Deletar instância antiga:
   ```bash
   curl -X DELETE http://localhost:8080/instance/logout/orbifinance \
     -H "apikey: orbifinance-evolution-api-key-2025"
   ```

2. Criar nova instância via Manager

---

### Webhook não recebe mensagens

**Problema**: Evolution API não envia para o OrbiFinance

**Checklist**:
1. ✅ Servidor Next.js rodando (`pnpm dev`)
2. ✅ Webhook URL configurada: `http://host.docker.internal:3000/api/webhooks/whatsapp`
3. ✅ Eventos de mensagem habilitados na instância
4. ✅ WhatsApp conectado (status: open)

**Debug**:
```bash
# Ver logs da Evolution API
docker-compose logs -f evolution-api

# Ver logs do Next.js (terminal onde pnpm dev está rodando)
```

---

### Banco de dados com dados antigos

**Resetar banco**:

```bash
# Parar containers
docker-compose down

# Remover volumes (CUIDADO: apaga TODOS os dados)
docker volume rm orbifinance-mvp-1_postgres_data
docker volume rm orbifinance-mvp-1_redis_data

# Subir novamente
docker-compose up -d

# Rodar migrations e seed
npx prisma migrate dev
npx prisma db seed
```

---

## 🚀 Workflow Completo de Desenvolvimento

```bash
# 1. Iniciar Docker
docker-compose up -d

# 2. Verificar containers
docker-compose ps

# 3. Setup banco (primeira vez)
npx prisma migrate dev
npx prisma db seed

# 4. Iniciar servidor
pnpm dev

# 5. Conectar WhatsApp (primeira vez)
# Acesse: http://localhost:8080/manager

# 6. Testar com mensagem real
# Envie: "gastei 50 no mercado #alimentacao"

# 7. Ver resultado
npx prisma studio
```

---

## 📚 Recursos

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)

---

**Última Atualização**: 11 de Janeiro de 2025
