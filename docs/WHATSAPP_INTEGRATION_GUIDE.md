# Guia de Integração WhatsApp - OrbiFinance

## Como Funciona

O serviço WhatsApp roda em `http://localhost:8081` e permite enviar mensagens automaticamente quando o usuário registra transações.

## Cenário: "Gastei R$50 abastecendo"

Quando o usuário cria uma transação no OrbiFinance, você pode enviar uma notificação automática via WhatsApp.

### Passo 1: Usuário Registra Transação

No frontend ou API do OrbiFinance, quando o usuário cria uma transação:

```typescript
// app/api/transactions/route.ts ou onde você cria transações

async function createTransaction(data) {
  // 1. Criar a transação no banco
  const transaction = await prisma.transaction.create({
    data: {
      description: "Abastecimento",
      amount: -50.00,
      categoryId: "combustivel",
      userId: session.user.id,
      // ...
    }
  });

  // 2. Enviar notificação WhatsApp
  await sendWhatsAppNotification(session.user, transaction);

  return transaction;
}
```

### Passo 2: Função de Envio WhatsApp

```typescript
// lib/whatsapp.ts

interface Transaction {
  description: string;
  amount: number;
  category: { name: string };
  date: Date;
}

interface User {
  name: string;
  phone: string; // Ex: "5511914500523"
}

export async function sendWhatsAppNotification(
  user: User,
  transaction: Transaction
) {
  try {
    // Formatar mensagem
    const message = formatTransactionMessage(transaction);

    // Enviar para API do WhatsApp
    const response = await fetch('http://localhost:8081/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.phone, // Ex: "5511914500523"
        message: message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao enviar WhatsApp:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('✅ WhatsApp enviado:', result);
    return { success: true, result };

  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    return { success: false, error };
  }
}

function formatTransactionMessage(transaction: Transaction): string {
  const tipo = transaction.amount < 0 ? '💸 Despesa' : '💰 Receita';
  const valor = Math.abs(transaction.amount).toFixed(2);
  const data = new Date(transaction.date).toLocaleDateString('pt-BR');

  return `
🏦 *OrbiFinance* - Nova Transação

${tipo} registrada com sucesso!

📝 *Descrição:* ${transaction.description}
💵 *Valor:* R$ ${valor}
🏷️ *Categoria:* ${transaction.category.name}
📅 *Data:* ${data}

_Transação registrada automaticamente_
  `.trim();
}
```

### Passo 3: Adicionar no Formulário de Transações

```typescript
// components/transaction-form.tsx

async function onSubmit(values: FormData) {
  try {
    // Criar transação
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const transaction = await response.json();

    if (response.ok) {
      toast.success('Transação criada!');

      // Opcional: Perguntar se quer notificação
      if (userPreferences.whatsappNotifications) {
        toast.info('Enviando notificação WhatsApp...');
      }

      router.refresh();
    }
  } catch (error) {
    toast.error('Erro ao criar transação');
  }
}
```

## Exemplo Completo de API Route

```typescript
// app/api/transactions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, amount, categoryId } = body;

    // Criar transação
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: parseFloat(amount),
        categoryId,
        userId: session.user.id,
        date: new Date(),
      },
      include: {
        category: true,
      },
    });

    // Buscar dados do usuário (incluindo telefone)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, phone: true, whatsappNotifications: true },
    });

    // Enviar WhatsApp se habilitado
    if (user?.whatsappNotifications && user?.phone) {
      try {
        await fetch('http://localhost:8081/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.phone,
            message: `🏦 *OrbiFinance*\n\n💸 Nova despesa: ${description}\n💵 Valor: R$ ${Math.abs(amount).toFixed(2)}\n🏷️ Categoria: ${transaction.category.name}\n\n_Transação registrada com sucesso!_`,
          }),
        });
      } catch (whatsappError) {
        // Não falhar a transação se WhatsApp falhar
        console.error('Erro WhatsApp:', whatsappError);
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## Formato do Número de Telefone

**Importante:** O número deve estar no formato internacional completo:

```
[Código do país][DDD][Número]

Exemplos:
✅ 5511914500523 (Brasil, SP, número)
✅ 5521987654321 (Brasil, RJ, número)
✅ 5585912345678 (Brasil, CE, número)

❌ 11914500523 (falta código do país)
❌ +5511914500523 (não use +)
❌ (11) 91450-0523 (não use formatação)
```

## Testando Manualmente

### 1. Verificar Status
```bash
curl http://localhost:8081/status
```

Resposta esperada:
```json
{
  "status": "connected",
  "instance": "orbifinance",
  "client": true,
  "qrCode": false
}
```

### 2. Enviar Mensagem de Teste
```bash
curl -X POST http://localhost:8081/send-message \
  -H "Content-Type: application/json" \
  -d "{\"to\": \"5511914500523\", \"message\": \"Teste: Gastei R$ 50,00 abastecendo\"}"
```

Resposta esperada:
```json
{
  "success": true,
  "result": {
    "id": "...",
    "timestamp": "..."
  },
  "timestamp": "2025-01-12T09:50:00.000Z"
}
```

## Configurações do Usuário

Adicione no schema do Prisma:

```prisma
model User {
  id                    String   @id @default(cuid())
  name                  String?
  email                 String   @unique
  phone                 String?  // Número WhatsApp
  whatsappNotifications Boolean  @default(false) // Ativar/desativar
  // ... outros campos
}
```

## Página de Configurações

```typescript
// app/[locale]/settings/page.tsx

export default function SettingsPage() {
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState(false);

  async function handleSave() {
    await fetch('/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        phone: phone.replace(/\D/g, ''), // Remove formatação
        whatsappNotifications: notifications,
      }),
    });
  }

  return (
    <div>
      <h1>Configurações WhatsApp</h1>

      <div>
        <label>Número WhatsApp</label>
        <input
          type="tel"
          placeholder="11914500523"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <small>Formato: DDD + número (sem espaços ou símbolos)</small>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          Receber notificações de transações via WhatsApp
        </label>
      </div>

      <button onClick={handleSave}>Salvar</button>
    </div>
  );
}
```

## Tipos de Notificações

### 1. Nova Transação
```typescript
const message = `🏦 *OrbiFinance*

💸 Nova despesa registrada!

📝 ${description}
💵 R$ ${amount}
🏷️ ${category}
📅 ${date}`;
```

### 2. Lembrete de Conta
```typescript
const message = `⏰ *OrbiFinance* - Lembrete

Você tem uma conta a pagar:

📝 ${description}
💵 R$ ${amount}
📅 Vence em: ${dueDate}

Não esqueça de pagar!`;
```

### 3. Alerta de Orçamento
```typescript
const message = `⚠️ *OrbiFinance* - Alerta de Orçamento

Você já gastou 80% do orçamento de ${category}:

💰 Gasto: R$ ${spent}
📊 Orçamento: R$ ${budget}
📈 Restante: R$ ${remaining}`;
```

### 4. Resumo Diário/Semanal
```typescript
const message = `📊 *OrbiFinance* - Resumo Semanal

💸 Despesas: R$ ${expenses}
💰 Receitas: R$ ${income}
📈 Saldo: R$ ${balance}

Top 3 Categorias:
1. ${cat1}: R$ ${amt1}
2. ${cat2}: R$ ${amt2}
3. ${cat3}: R$ ${amt3}`;
```

## Troubleshooting

### Erro: "WhatsApp not connected"
- Verifique se o serviço está rodando: `http://localhost:8081/status`
- Certifique-se de que você escaneou o QR Code
- Reinicie o serviço se necessário

### Mensagem não chega
- Verifique o formato do número (deve incluir código do país)
- Teste enviando para o número que escaneou o QR Code primeiro
- Verifique se o número está salvo nos contatos do WhatsApp

### Serviço caiu
- Execute: `cd whatsapp-service && pnpm start`
- Se der erro de "browser already running", execute:
  ```bash
  powershell -Command "Get-Process chrome | Stop-Process -Force; Start-Sleep 2"
  pnpm start
  ```

## Manter Serviço Rodando

Para produção, use PM2:

```bash
npm install -g pm2

# Iniciar
pm2 start index.js --name orbi-whatsapp

# Ver logs
pm2 logs orbi-whatsapp

# Reiniciar
pm2 restart orbi-whatsapp

# Parar
pm2 stop orbi-whatsapp
```
