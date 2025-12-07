# Guia de Configuração OAuth - OrbiFinance

Este guia detalha como configurar login social (Google, GitHub, Microsoft) usando Better Auth.

## Visão Geral

O OrbiFinance implementa autenticação OAuth 2.0 através do Better Auth com os seguintes provedores:
- **Google** - Com suporte a refresh tokens offline
- **GitHub** - Com escopo de email obrigatório
- **Microsoft** - Com autenticação multi-tenant

## URLs de Callback (Redirect URLs)

Ao configurar cada provedor OAuth, você precisará adicionar as seguintes URLs de callback:

### Desenvolvimento
```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github
http://localhost:3000/api/auth/callback/microsoft
```

### Produção
```
https://seudominio.com/api/auth/callback/google
https://seudominio.com/api/auth/callback/github
https://seudominio.com/api/auth/callback/microsoft
```

---

## 1. Google OAuth Setup

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Navegue para **APIs & Services** > **Credentials**

### Passo 2: Configurar OAuth Consent Screen

1. Vá em **OAuth consent screen**
2. Selecione **External** (para uso público)
3. Preencha:
   - **App name**: OrbiFinance
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Adicione escopos:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`

### Passo 3: Criar OAuth Client ID

1. Vá em **Credentials** > **Create Credentials** > **OAuth client ID**
2. Selecione **Web application**
3. Nome: "OrbiFinance Web"
4. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://seudominio.com/api/auth/callback/google
   ```
5. Clique em **Create**
6. Copie o **Client ID** e **Client Secret**

### Passo 4: Adicionar ao .env

```env
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

### Configurações Especiais

- **Access Type**: `offline` - Habilita refresh tokens
- **Prompt**: `select_account` - Força seleção de conta (configurável)

**Importante**: Google só emite refresh token na primeira vez que o usuário autoriza. Para obter novo refresh token, revogue o acesso em [Google Account Permissions](https://myaccount.google.com/permissions).

---

## 2. GitHub OAuth Setup

### Passo 1: Criar OAuth App

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em **New OAuth App**
3. Preencha:
   - **Application name**: OrbiFinance
   - **Homepage URL**: `http://localhost:3000` (dev) ou `https://seudominio.com` (prod)
   - **Authorization callback URL**:
     ```
     http://localhost:3000/api/auth/callback/github
     ```

### Passo 2: Configurar Permissões

**CRÍTICO**: Você DEVE incluir o escopo `user:email`

Para GitHub Apps (não OAuth Apps):
1. Vá em **Permissions and events** > **Account Permissions** > **Email Addresses**
2. Configure como **Read-Only**

### Passo 3: Gerar Client Secret

1. Clique em **Generate a new client secret**
2. Copie imediatamente (só mostra uma vez)

### Passo 4: Adicionar ao .env

```env
GITHUB_CLIENT_ID="Iv1.xxxxx"
GITHUB_CLIENT_SECRET="xxxxx"
```

### Notas Importantes

- GitHub **não emite refresh tokens** para OAuth apps
- Access tokens permanecem válidos indefinidamente (ou até 12 meses sem uso)

---

## 3. Microsoft OAuth Setup

### Passo 1: Acessar Azure Portal

1. Acesse [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Clique em **New registration**

### Passo 2: Registrar Aplicação

1. **Nome**: OrbiFinance
2. **Supported account types**:
   - Selecione **Accounts in any organizational directory and personal Microsoft accounts**
3. **Redirect URI**:
   - Tipo: **Web**
   - URL: `http://localhost:3000/api/auth/callback/microsoft`
4. Clique em **Register**

### Passo 3: Adicionar Redirect URIs Adicionais

1. Após criação, vá em **Authentication**
2. Em **Redirect URIs**, adicione:
   ```
   https://seudominio.com/api/auth/callback/microsoft
   ```

### Passo 4: Criar Client Secret

1. Vá em **Certificates & secrets**
2. Clique em **New client secret**
3. Descrição: "OrbiFinance Web"
4. Expiration: 24 meses (recomendado)
5. Clique em **Add**
6. **Copie o Value imediatamente** (só mostra uma vez)

### Passo 5: Copiar Application ID

1. Vá em **Overview**
2. Copie o **Application (client) ID**

### Passo 6: Adicionar ao .env

```env
MICROSOFT_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MICROSOFT_CLIENT_SECRET="xxxxx~xxxxx"
```

### Configurações Especiais

- **Tenant ID**: `common` - Permite contas pessoais e organizacionais
- **Authority**: `https://login.microsoftonline.com` - Endpoint padrão
- **Prompt**: `select_account` - Força seleção de conta

Para CIAM (Customer Identity Access Management):
```typescript
authority: "https://<tenant-id>.ciamlogin.com"
```

---

## Configuração do Better Auth

A configuração já está implementada em `lib/auth.ts`:

```typescript
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      accessType: "offline", // Habilita refresh tokens
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: "common",
      authority: "https://login.microsoftonline.com",
      prompt: "select_account",
    },
  },
  account: {
    accountLinking: {
      enabled: true, // Permite vincular múltiplos provedores
    },
  },
})
```

---

## Account Linking (Vinculação de Contas)

O Better Auth permite que usuários vinculem múltiplos provedores OAuth à mesma conta.

### Como Funciona

1. Usuário faz login com Google (cria conta)
2. Depois faz login com GitHub usando **mesmo email**
3. Better Auth detecta email verificado e vincula automaticamente

### Requisitos

- Email deve estar verificado pelo provedor
- `accountLinking.enabled: true` na configuração

### Adicionar Provedores Adicionais

```typescript
// Client-side
await authClient.linkSocial({
  provider: "google",
  callbackURL: "/settings",
})
```

---

## Componente de UI

O componente `SocialLogin` já está implementado:

```typescript
import { SocialLogin } from "@/components/auth/social-login"

// Uso em páginas de auth
<SocialLogin />
```

### Implementação

```typescript
const handleSocialLogin = async (provider: "google" | "github" | "microsoft") => {
  await authClient.signIn.social({
    provider,
    callbackURL: "/dashboard",
  })
}
```

---

## Fluxo de Autenticação

### 1. Usuário Clica em Botão Social
```
User clicks "Google" → authClient.signIn.social({ provider: "google" })
```

### 2. Redirecionamento para Provedor
```
Browser → https://accounts.google.com/o/oauth2/v2/auth?...
```

### 3. Usuário Autoriza
```
User grants permission → Google redirects to callback
```

### 4. Better Auth Processa Callback
```
/api/auth/callback/google → Creates/updates user → Redirects to /dashboard
```

### 5. Sessão Criada
```
Cookie session created → User logged in
```

---

## Testando OAuth

### Desenvolvimento Local

1. Configure todos os 3 provedores no .env
2. Inicie o servidor: `pnpm dev`
3. Acesse: `http://localhost:3000/auth/login`
4. Clique em qualquer botão social
5. Autorize a aplicação
6. Deve redirecionar para `/dashboard`

### Verificar Sessão

```typescript
const session = await auth.api.getSession({ headers: request.headers })
console.log(session?.user) // { id, email, name, image, ... }
```

---

## Troubleshooting

### "Redirect URI mismatch"
**Causa**: URL de callback não está configurada no provedor
**Solução**: Adicione exatamente `http://localhost:3000/api/auth/callback/{provider}`

### "Email not verified"
**Causa**: Better Auth requer email verificado
**Solução**: Verifique email no provedor ou desabilite `requireEmailVerification`

### "Invalid client_id"
**Causa**: Client ID incorreto no .env
**Solução**: Verifique que copiou corretamente do console do provedor

### "This app is not verified" (Google)
**Causa**: App não passou por verificação do Google
**Solução**: Para testes, clique em "Advanced" > "Go to OrbiFinance (unsafe)"

### GitHub não retorna email
**Causa**: Escopo `user:email` não configurado
**Solução**: No GitHub App, habilite permissão de email como Read-Only

---

## Segurança

### Boas Práticas Implementadas

- **PKCE Flow**: Better Auth usa PKCE automaticamente
- **State Parameter**: Proteção contra CSRF
- **Nonce**: Validação de ID tokens (OIDC)
- **Account Linking**: Só vincula emails verificados
- **Session Security**: Cookies HttpOnly, Secure, SameSite

### Secrets Management

**NUNCA commite .env no Git!**

```bash
# .gitignore
.env
.env.local
.env.production
```

### Produção

1. Use variáveis de ambiente do host (Vercel, Railway, etc)
2. Rotacione secrets periodicamente
3. Configure URLs de callback de produção
4. Habilite 2FA nas contas de desenvolvedor

---

## Custos

Todos os provedores oferecem tier gratuito generoso:

| Provedor | Free Tier | Limites |
|----------|-----------|---------|
| Google | Sim | Ilimitado (uso razoável) |
| GitHub | Sim | Ilimitado |
| Microsoft | Sim | Ilimitado para contas pessoais |

---

## Próximos Passos

Após configurar OAuth:

1. ✅ Teste signup com cada provedor
2. ✅ Teste account linking (login com 2 provedores)
3. ✅ Verifique que categorias padrão são criadas
4. ✅ Teste logout e re-login
5. ✅ Configure URLs de produção
6. ✅ Documente credenciais em gerenciador de secrets (1Password, etc)

---

## Referências

- [Better Auth - Google](https://www.better-auth.com/docs/authentication/google)
- [Better Auth - GitHub](https://www.better-auth.com/docs/authentication/github)
- [Better Auth - Microsoft](https://www.better-auth.com/docs/authentication/microsoft)
- [Better Auth - OAuth Concepts](https://www.better-auth.com/docs/concepts/oauth)
- [Google Cloud Console](https://console.cloud.google.com)
- [GitHub Developer Settings](https://github.com/settings/developers)
- [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
