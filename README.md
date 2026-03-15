# Diário de Crises — Dra. Mônica Seixas

Plataforma web de acompanhamento de crises epilépticas.

---

## Pré-requisitos

- Node.js 18+ instalado (https://nodejs.org)
- Conta no Supabase com Etapa 1 executada
- Git (opcional)

---

## Rodando Localmente

### 1. Baixar ou clonar o projeto

```bash
# Se veio como .zip, extraia e entre na pasta
cd diario-crises

# Ou clone do repositório
git clone https://github.com/SEU_USUARIO/diario-crises.git
cd diario-crises
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

O arquivo `.env.local` já está preenchido com as credenciais do Supabase.
Se precisar recriar:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```
NEXT_PUBLIC_SUPABASE_URL=https://qzhpaettknzajzdvfine.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 4. Adicionar a logo

Coloque o arquivo `logo_monica.jpg` dentro da pasta `public/`:
```
public/
  logo_monica.jpg   ← aqui
  manifest.json
  icons/
```

### 5. Adicionar ícones PWA (opcional para desenvolvimento)

Crie dois arquivos PNG na pasta `public/icons/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Pode usar a logo da Dra. Mônica redimensionada.

### 6. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── login/          → Página de login (CPF ou e-mail)
│   ├── instrucoes/     → Página pública de instruções
│   ├── doctor/         → Área da Dra. Mônica
│   │   ├── page.tsx         → Dashboard (lista de pacientes)
│   │   ├── patients/        → Cadastro e edição de pacientes
│   │   └── triggers/        → Gerenciar desencadeantes
│   └── patient/        → Área do paciente
│       └── agenda/          → Agenda mensal
│
├── components/
│   ├── ui/             → Componentes base (Modal, Toast, Loading...)
│   ├── shared/         → Logo, Header, layouts
│   ├── doctor/         → Componentes do dashboard
│   └── patient/        → Componentes da agenda
│
├── hooks/
│   └── useAuth.ts      → Hook de autenticação
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts   → Supabase browser client
│   │   └── server.ts   → Supabase server client
│   └── utils.ts        → Utilitários (formatCPF, generatePassword...)
│
├── types/
│   └── index.ts        → Todos os tipos TypeScript
│
└── middleware.ts        → Proteção de rotas por role
```

---

## Fluxo de Autenticação

```
/login
  ├── Dra. Mônica → email: monicaseixas89@gmail.com
  │                  senha: Crm@28539
  │                  → redireciona para /doctor
  │
  └── Paciente   → CPF: 000.000.000-00
                   senha: primeirnome123
                   → redireciona para /patient/agenda
```

---

## Deploy na Vercel

### 1. Criar repositório no GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/diario-crises.git
git push -u origin main
```

### 2. Importar na Vercel

1. Acesse https://vercel.com
2. Clique em **"Add New Project"**
3. Importe o repositório do GitHub
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qzhpaettknzajzdvfine.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `(sua anon key)`
5. Clique em **Deploy**

### 3. Configurar URL no Supabase

Após o deploy, copie a URL da Vercel (ex: `https://diario-crises.vercel.app`) e:

1. No Supabase → **Authentication → URL Configuration**
2. Adicione em **Redirect URLs**: `https://diario-crises.vercel.app/**`
3. Em **Site URL**: `https://diario-crises.vercel.app`

---

## Etapas de Desenvolvimento

| # | Etapa | Status |
|---|-------|--------|
| 1 | Banco de dados Supabase | ✅ Concluída |
| 2 | Setup Next.js + Tema + Auth | ✅ Concluída |
| 3 | Dashboard da Médica | 🔄 Próxima |
| 4 | Cadastro de Pacientes | ⏳ |
| 5 | Agenda do Paciente | ⏳ |
| 6 | Análise e Gráficos | ⏳ |
| 7 | Relatórios e PDF | ⏳ |
