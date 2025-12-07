# Venom-bot - Guia Completo de Solução de Problemas no Windows

## Problema Atual

Você está enfrentando dois erros principais:

1. **Failed to launch the browser process! undefined**
2. **TargetCloseError: Protocol error (Page.setBypassCSP): Session closed**

## Diagnóstico

Analisando seus logs anteriores:
- O navegador Chrome está instalado em: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- O Puppeteer baixou o Chromium para: `C:\Users\wesle\.cache\puppeteer\chrome\`
- O Venom-bot tentou usar o Chrome do sistema mas a página fechou prematuramente

### Causas Identificadas

1. **Conflito de versões**: Venom-bot usando Chrome do sistema (v142) em vez do Chromium do Puppeteer
2. **Timeout da página**: WhatsApp Web fechando antes de carregar completamente
3. **Configuração inadequada**: Opções do Venom não otimizadas para Windows

## Solução: Método 1 - Forçar uso do Chromium do Puppeteer

### Passo 1: Instalar Chromium corretamente

```powershell
cd "C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service"
pnpm install puppeteer --force
```

### Passo 2: Aprovar scripts de build (IMPORTANTE!)

O pnpm bloqueou os scripts de build do Puppeteer. Execute:

```powershell
pnpm approve-builds puppeteer
```

Ou force a instalação com scripts:

```powershell
pnpm rebuild puppeteer
```

### Passo 3: Atualizar configuração do Venom

Edite o arquivo `index.js` e adicione o `executablePath`:

```javascript
const puppeteer = require('puppeteer');

// No início do arquivo, obter o caminho do Chrome
const chromePath = puppeteer.executablePath();
console.log('📍 Using Chrome from:', chromePath);

// Dentro da função initializeVenom(), nas opções do venom.create():
venomClient = await venom.create(
  INSTANCE_NAME,
  (base64Qr) => { /* ... */ },
  (statusSession) => { /* ... */ },
  {
    folderName: 'sessions',
    headless: false,
    devtools: false,
    debug: false,
    logQR: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    executablePath: chromePath, // IMPORTANTE: Força uso do Chromium do Puppeteer
    disableSpins: true,
    disableWelcome: true,
    autoClose: 120000, // Aumentar timeout para 2 minutos
    createPathFileToken: false,
    puppeteerOptions: {
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    }
  }
);
```

## Solução: Método 2 - Usar Chrome do Sistema (mais estável)

Se o Método 1 não funcionar, use o Chrome instalado no sistema:

```javascript
venomClient = await venom.create(
  INSTANCE_NAME,
  (base64Qr) => { /* ... */ },
  (statusSession) => { /* ... */ },
  {
    folderName: 'sessions',
    headless: false,
    devtools: false,
    debug: false,
    logQR: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-blink-features=AutomationControlled'
    ],
    disableSpins: true,
    disableWelcome: true,
    autoClose: 180000, // 3 minutos
    createPathFileToken: false,
    puppeteerOptions: {
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ]
    }
  }
);
```

## Solução: Método 3 - Limpar Cache e Reinstalar

Se nenhum método acima funcionar:

### 1. Limpar tudo

```powershell
cd "C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service"

# Remover node_modules
Remove-Item -Recurse -Force node_modules

# Remover lockfile
Remove-Item pnpm-lock.yaml

# Limpar cache do pnpm
pnpm store prune

# Limpar cache do Puppeteer
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\puppeteer"

# Limpar sessões antigas
Remove-Item -Recurse -Force sessions
```

### 2. Reinstalar dependências

```powershell
# Instalar sem ignorar scripts
pnpm install --force --shamefully-hoist

# Aprovar build scripts
pnpm approve-builds puppeteer sharp
```

### 3. Verificar instalação

```powershell
node -e "console.log(require('puppeteer').executablePath())"
```

Deve retornar um caminho válido para o Chrome/Chromium.

## Comandos para Executar (SOLUÇÃO COMPLETA)

Siga esta sequência EXATAMENTE:

```powershell
# 1. Entrar no diretório
cd "C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service"

# 2. Instalar Puppeteer mais recente (v24+)
pnpm add puppeteer@latest

# 3. Instalar Chrome via Puppeteer CLI (bypassa pnpm approve-builds)
npx puppeteer browsers install chrome

# 4. Remover Sharp problemático
pnpm remove sharp

# 5. Reinstalar Sharp com npm para garantir binários nativos
npm install --platform=win32 --arch=x64 sharp

# 6. Verificar instalações
node -e "console.log('Chrome:', require('puppeteer').executablePath())"
node -e "const sharp = require('sharp'); console.log('Sharp OK')"

# 7. Iniciar o serviço
pnpm start
```

## Problemas Conhecidos

### Erro: "Ignored build scripts"

**Causa**: pnpm bloqueou scripts de instalação por segurança

**Solução**:
```powershell
# Use npx em vez de pnpm rebuild
npx puppeteer browsers install chrome

# Para Sharp, use npm diretamente
npm install --platform=win32 --arch=x64 sharp
```

### Erro: "Cannot find module '../build/Release/sharp-win32-x64.node'"

**Causa**: Sharp não compilou binários nativos para Windows

**Solução**:
```powershell
pnpm remove sharp
npm install --platform=win32 --arch=x64 sharp
```

### Erro: Chrome muito pequeno (2-3MB) ou corrompido

**Causa**: Download incompleto do Puppeteer

**Solução**:
```powershell
# Remover cache corrompido
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\puppeteer\chrome\win64-121*"

# Reinstalar com Puppeteer CLI
npx puppeteer browsers install chrome
```

### Erro: "Session closed. Most likely the page has been closed"

**Causa**: WhatsApp Web detectando automação ou timeout

**Solução**:
1. Aumentar `autoClose` para 180000 (3 minutos)
2. Adicionar flags anti-detecção:
   ```javascript
   '--disable-blink-features=AutomationControlled'
   '--disable-web-security'
   ```

### Erro: "The browser is already running for ... Use a different userDataDir"

**Causa**: Instância anterior do Chrome não foi fechada corretamente

**Solução**:
```powershell
# Matar todos os processos do Chrome
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force

# Aguardar 2 segundos
Start-Sleep -Seconds 2

# Remover diretórios de dados antigos
Remove-Item -Recurse -Force ".\tokens" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".\sessions" -ErrorAction SilentlyContinue

# Reiniciar o serviço
pnpm start
```

### Erro: "Failed to launch the browser process"

**Causa**: Chrome não encontrado ou permissões

**Solução**:
1. Verificar se Chrome existe: `Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe"`
2. Executar PowerShell como Administrador
3. Desabilitar antivírus temporariamente

## Verificação Final

Após executar as soluções, você deve ver:

```
🌐 Server running on http://localhost:8081
🚀 Initializing Venom...
📊 Status: initBrowser
📊 Status: openBrowser
📊 Status: initWhatsapp
📱 QR Code generated!
```

Acesse `http://localhost:8081` e escaneie o QR Code com WhatsApp.

## Importante

- **SEMPRE** execute `pnpm approve-builds` antes de usar o Venom
- **NÃO** use `headless: true` no Windows (causa problemas)
- **LIMPE** a pasta `sessions/` se mudar configurações
- **AGUARDE** o navegador abrir completamente antes de interagir

## Logs de Sucesso

Quando funcionar corretamente, você verá:

```
- Executable path browser: C:\Users\wesle\.cache\puppeteer\chrome\win64-xxx\chrome.exe
- Browser successfully opened
- headless option is disabled, browser visible
- Checking page to whatzapp...
📊 Status: qrCode
✅ WhatsApp connected successfully!
```
