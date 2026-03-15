import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen, Plus, Moon, AlertCircle, ClipboardList,
  ChevronRight, Smartphone, Calendar
} from 'lucide-react'

export default function InstrucoesPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Decoração */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-lilac-200/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gold-200/15 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-24">
              <Image src="/logo_monica.jpg" alt="Dra. Mônica Seixas" fill className="object-contain" priority />
            </div>
          </div>
          <div className="divider-gold w-24 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-semibold text-ink">Diário de Crises</h1>
          <p className="text-ink-muted mt-2">Como usar a plataforma</p>
        </div>

        {/* Seção 1 — O que é */}
        <Section icon={BookOpen} title="O que é o Diário de Crises?">
          <p className="text-ink-muted leading-relaxed">
            O Diário de Crises é uma plataforma digital criada pela <strong className="text-ink">Dra. Mônica Seixas</strong> para
            que você possa registrar suas crises epilépticas de forma simples, diretamente pelo celular ou computador.
            Com esses registros, sua médica acompanha sua evolução com muito mais precisão.
          </p>
        </Section>

        {/* Seção 2 — Como acessar */}
        <Section icon={Smartphone} title="Como acessar">
          <ol className="space-y-3 text-ink-muted">
            <Step n={1}>Abra o link que sua médica enviou, ou acesse diretamente pelo endereço da plataforma.</Step>
            <Step n={2}>Digite seu <strong className="text-ink">CPF</strong> (somente números ou no formato 000.000.000-00).</Step>
            <Step n={3}>Digite sua <strong className="text-ink">senha</strong> — fornecida pela Dra. Mônica.</Step>
            <Step n={4}>Clique em <strong className="text-ink">Entrar</strong>.</Step>
          </ol>
          <div className="bg-lilac-50 rounded-xl p-4 mt-4 border border-lilac-200">
            <p className="text-sm text-lilac-700">
              <strong>💡 Dica:</strong> Você pode instalar a plataforma como aplicativo no seu celular.
              No iPhone, toque em &quot;Compartilhar&quot; → &quot;Adicionar à Tela de Início&quot;.
              No Android, toque em &quot;Menu&quot; → &quot;Adicionar à tela inicial&quot;.
            </p>
          </div>
        </Section>

        {/* Seção 3 — Agenda mensal */}
        <Section icon={Calendar} title="A agenda mensal">
          <p className="text-ink-muted leading-relaxed mb-3">
            Após entrar, você verá uma tabela com todos os dias do mês atual. Para cada dia, há três colunas:
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['Manhã', 'Tarde', 'Noite'].map(t => (
              <div key={t} className="bg-white rounded-xl border border-surface-border p-3 text-center">
                <p className="font-semibold text-ink text-sm">{t}</p>
              </div>
            ))}
          </div>
          <p className="text-ink-muted text-sm">
            Toque na célula do turno em que a crise ocorreu e selecione o tipo de crise.
            Você pode registrar mais de uma crise no mesmo turno.
          </p>
        </Section>

        {/* Seção 4 — Símbolos */}
        <Section icon={ClipboardList} title="Símbolos das crises">
          <p className="text-ink-muted text-sm mb-3">
            Cada tipo de crise tem um símbolo. Sua médica configurou os símbolos específicos para o seu caso.
            O símbolo universal é:
          </p>
          <div className="bg-white rounded-xl border border-surface-border p-4 flex items-center gap-4">
            <span className="text-3xl font-bold text-ink">+</span>
            <div>
              <p className="font-semibold text-ink text-sm">Convulsão</p>
              <p className="text-xs text-ink-muted">Crise tônico-clônica bilateral / generalizada</p>
            </div>
          </div>
          <p className="text-sm text-ink-muted mt-3">
            Os demais símbolos são mostrados diretamente na tela ao registrar uma crise.
          </p>
        </Section>

        {/* Seção 5 — Sono */}
        <Section icon={Moon} title="Crises durante o sono">
          <p className="text-ink-muted leading-relaxed">
            Se a crise ocorreu enquanto você estava dormindo, marque a opção{' '}
            <strong className="text-ink">&quot;Ocorreu durante o sono&quot;</strong> ao registrar.
            Isso é muito importante para o diagnóstico da sua médica.
          </p>
        </Section>

        {/* Seção 6 — Desencadeantes */}
        <Section icon={AlertCircle} title="Fatores desencadeantes">
          <p className="text-ink-muted leading-relaxed mb-3">
            No campo de observações de cada dia, você pode marcar se algum fator pode ter provocado a crise:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Privação de sono', 'Estresse emocional', 'Febre ou infecção',
              'Esquecimento de medicação', 'Consumo de álcool', 'Período menstrual',
              'Exposição a luz intensa', 'Jejum'
            ].map(f => (
              <div key={f} className="flex items-center gap-2 bg-white rounded-lg border border-surface-border px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-lilac-400 flex-shrink-0" />
                <span className="text-xs text-ink-muted">{f}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-ink-muted mt-3">
            Se nenhum se aplica, você pode escrever livremente no campo de observações.
          </p>
        </Section>

        {/* Botão de acesso */}
        <div className="mt-10 text-center animate-slide-up">
          <Link
            href="/login"
            className="btn-primary px-10 py-4 text-base shadow-gold"
          >
            <span>Acessar o Diário</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-ink-light mt-4">
            Plataforma exclusiva — Dra. Mônica Seixas · Neurologista
          </p>
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
function Section({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-surface-border p-6 mb-4 animate-slide-up shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-lilac-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-lilac-600" />
        </div>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-lilac-100 text-lilac-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span className="text-sm leading-relaxed">{children}</span>
    </li>
  )
}
