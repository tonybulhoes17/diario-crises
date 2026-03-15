# Deploy na Vercel — Diário de Crises
## Dra. Mônica Seixas

---

## PRÉ-REQUISITOS

- [ ] Conta no GitHub: https://github.com
- [ ] Conta na Vercel: https://vercel.com
- [ ] Git instalado no computador
- [ ] Etapas 1 a 6 concluídas e funcionando localmente

---

## PASSO 1 — Criar repositório no GitHub

### 1.1 Criar o repositório

1. Acesse https://github.com/new
2. Preencha:
   - **Repository name:** `diario-crises`
   - **Visibility:** Private ✅ (recomendado — dados de saúde)
   - **NÃO marque** "Add README" (já temos)
3. Clique em **"Create repository"**
4. Copie a URL do repositório (ex: `https://github.com/SEU_USUARIO/diario-crises.git`)

### 1.2 Enviar o código para o GitHub

Abra o terminal na pasta `diario-crises` e execute:

```bash
git init
git add .
git commit -m "feat: plataforma Diário de Crises completa"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/diario-crises.git
git push -u origin main
```

> ⚠️ O arquivo `.env.local` está no `.gitignore` — suas chaves NÃO serão enviadas para o GitHub.

---

## PASSO 2 — Configurar variáveis de ambiente na Vercel

Antes do deploy, você precisa ter em mãos:

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |

---

## PASSO 3 — Deploy na Vercel

### 3.1 Importar o projeto

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Conecte sua conta GitHub se ainda não estiver conectada
4. Selecione o repositório **`diario-crises`**
5. Clique em **"Import"**

### 3.2 Configurar o projeto

Na tela de configuração:

- **Framework Preset:** Next.js (detectado automaticamente)
- **Root Directory:** `./` (padrão)
- **Build Command:** `next build` (padrão)
- **Output Directory:** `.next` (padrão)

### 3.3 Adicionar variáveis de ambiente

Ainda na tela de configuração, expanda **"Environment Variables"** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL        = https://qzhpaettknzajzdvfine.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci...sua_anon_key
SUPABASE_SERVICE_ROLE_KEY       = eyJhbGci...sua_service_role_key
```

### 3.4 Fazer o deploy

Clique em **"Deploy"** e aguarde ~2 minutos.

✅ Você receberá uma URL como: `https://diario-crises.vercel.app`

---

## PASSO 4 — Configurar o Supabase para aceitar a URL da Vercel

Após o deploy, configure o Supabase para aceitar redirecionamentos da sua URL:

1. No Supabase, vá em **Authentication → URL Configuration**
2. Em **Site URL**, coloque: `https://diario-crises.vercel.app`
3. Em **Redirect URLs**, adicione:
   ```
   https://diario-crises.vercel.app/**
   https://diario-crises-*.vercel.app/**
   ```
4. Clique em **"Save"**

---

## PASSO 5 — Configurar domínio personalizado (opcional)

Se quiser usar um domínio próprio (ex: `diariodecrises.com.br`):

1. Na Vercel, vá em seu projeto → **Settings → Domains**
2. Clique em **"Add Domain"**
3. Digite seu domínio e siga as instruções de DNS
4. Após configurar, adicione o domínio no Supabase também (Redirect URLs)

---

## PASSO 6 — Verificar se tudo está funcionando

Acesse sua URL da Vercel e teste:

- [ ] Página de login carrega corretamente
- [ ] Login da Dra. Mônica funciona (`monicaseixas89@gmail.com`)
- [ ] Dashboard de pacientes carrega
- [ ] Cadastro de novo paciente funciona
- [ ] Login do paciente com CPF funciona
- [ ] Agenda do paciente carrega
- [ ] Registro de crise salva corretamente
- [ ] Relatório gera corretamente

---

## ATUALIZAÇÕES FUTURAS

Para atualizar a plataforma após qualquer mudança no código:

```bash
git add .
git commit -m "fix: descrição da mudança"
git push
```

A Vercel faz o redeploy automaticamente em ~1 minuto. ✅

---

## RESOLUÇÃO DE PROBLEMAS

### Erro: "Function Timeout"
- As API Routes têm limite de 10s no plano gratuito
- Solução: upgrade para Vercel Pro ou otimizar as queries

### Erro: "Environment Variable not found"
- Verifique se adicionou as 3 variáveis na Vercel
- Refaça o deploy após adicionar variáveis

### Erro: "Invalid URL" no Supabase Auth
- Verifique se adicionou a URL da Vercel no Supabase → Authentication → URL Configuration

### Paciente não consegue logar na URL de produção
- Verifique se o Supabase tem a URL de produção nas Redirect URLs

---

## RESUMO FINAL DO SISTEMA

```
PLATAFORMA: Diário de Crises — Dra. Mônica Seixas
STACK:       Next.js 15 + Supabase + Tailwind CSS
DEPLOY:      Vercel (https://diario-crises.vercel.app)
BANCO:       Supabase (https://qzhpaettknzajzdvfine.supabase.co)

ACESSO MÉDICA:
  URL:   https://diario-crises.vercel.app/login
  Email: monicaseixas89@gmail.com
  Senha: Crm@28539

ACESSO PACIENTE:
  URL:   https://diario-crises.vercel.app/login
  Login: CPF do paciente
  Senha: primeirnome123 (gerada automaticamente)

PÁGINA DE INSTRUÇÕES (pública):
  https://diario-crises.vercel.app/instrucoes
```
