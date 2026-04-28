import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NEXTPRESS_CONFIG } from '../../../config';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Command,
  ExternalLink,
  FileText,
  Github,
  Home,
  MessageSquare,
  Settings,
  Terminal,
} from 'lucide-react';

const cliCommands = [
  { command: 'nextpress status', note: 'Check service health and install state' },
  { command: 'nextpress logs', note: 'Inspect recent runtime logs' },
  { command: 'nextpress restart', note: 'Restart the installed service' },
  { command: 'nextpress upgrade', note: 'Upgrade using the supported flow' },
];

const setupSteps = [
  'Open the admin panel and create a page in Pages.',
  'Design the page in the Page Builder and publish it.',
  'Use Set as Homepage from Pages or Page Settings.',
];

const supportedFeatures = [
  'Block-based page builder',
  'Pages, posts, media, comments, and users',
  'WordPress-compatible REST API shape',
  'Site settings and domain configuration',
  'Templates and theme rendering foundation',
  'CLI install, status, logs, restart, and upgrade flows',
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#cbd6e2] text-[#0a0a0a]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(10,10,10,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(10,10,10,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3" aria-label="NextPress home">
            <img
              src="/logo.svg"
              alt="NextPress"
              className="h-8 w-auto max-w-[180px] sm:h-9"
            />
          </a>
          <div className="flex items-center gap-2">
            <Badge className="hidden rounded-full bg-black px-3 py-1 text-white hover:bg-black sm:inline-flex">
              Installed v{NEXTPRESS_CONFIG.version}
            </Badge>
            <a href={NEXTPRESS_CONFIG.links.admin}>
              <Button className="rounded-md bg-black px-5 text-white hover:bg-black/85">
                Admin
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </a>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <section className="max-w-3xl">
            <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-8xl">
              Your NextPress install is ready.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-black/70 sm:text-lg">
              This informational page appears until you publish and assign a
              designed homepage. NextPress gives you a WordPress-compatible CMS
              workflow with a JavaScript runtime, block editing, API routes, and
              deployment tooling.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={NEXTPRESS_CONFIG.links.pages}>
                <Button className="h-12 rounded-md bg-black px-6 text-white hover:bg-black/85">
                  Create homepage
                  <Home className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </a>
              <a href={NEXTPRESS_CONFIG.links.docs} target="_blank" rel="noreferrer">
                <Button
                  variant="outline"
                  className="h-12 rounded-md border-black/25 bg-white/20 px-6 text-black hover:bg-white/35"
                >
                  Read docs
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </a>
            </div>
          </section>

          <section className="relative min-h-[460px]" aria-label="NextPress setup overview">
            <div className="absolute left-0 top-8 w-[78%] rounded-2xl border border-white/60 bg-white/45 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur">
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-black/50">
                <Terminal className="h-4 w-4" aria-hidden />
                CLI quick start
              </div>
              <div className="space-y-3">
                {cliCommands.map((item) => (
                  <div key={item.command} className="rounded-xl bg-black p-4 text-white">
                    <code className="text-sm font-semibold">{item.command}</code>
                    <p className="mt-1 text-xs text-white/55">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-10 right-0 w-[76%] rounded-2xl border border-white/15 bg-[#22262A] p-6 text-white shadow-2xl shadow-slate-900/25 ring-1 ring-black/10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">
                    Homepage flow
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Publish, then assign.
                  </h2>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#22262A]">
                  <Settings className="h-6 w-6" aria-hidden />
                </div>
              </div>
              <ol className="space-y-3">
                {setupSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-white/78">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-white text-xs font-bold text-[#22262A]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="absolute right-4 top-0 grid h-28 w-28 place-items-center rounded-2xl bg-white text-center shadow-xl shadow-slate-900/10">
              <div>
                <p className="text-3xl font-black tracking-[-0.06em]">v{NEXTPRESS_CONFIG.version}</p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">current</p>
              </div>
            </div>
          </section>
        </main>

        <section className="grid gap-4 pb-12 lg:grid-cols-3">
          <InfoPanel
            icon={<Code2 className="h-5 w-5" aria-hidden />}
            title="About NextPress"
            text="A self-hostable, WordPress-compatible CMS built with TypeScript, React, Express, and a modern page builder."
          />
          <InfoPanel
            icon={<FileText className="h-5 w-5" aria-hidden />}
            title="Supported Features"
            text={supportedFeatures.join(' • ')}
          />
          <InfoPanel
            icon={<Command className="h-5 w-5" aria-hidden />}
            title="CLI"
            text="Use the NextPress CLI for install, status, logs, restart, reload, upgrade, and uninstall workflows."
          />
        </section>

        <footer className="-mx-6 flex flex-col gap-4 rounded-t-[2rem] bg-[#22262A] px-6 py-7 text-sm text-white/70 sm:-mx-10 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:-mx-16 lg:px-16">
          <p className="text-white/70">Set a real homepage any time from the admin area.</p>
          <div className="flex flex-wrap gap-3">
            <FooterLink href={NEXTPRESS_CONFIG.links.github} icon={<Github className="h-4 w-4" aria-hidden />}>
              GitHub
            </FooterLink>
            <FooterLink href={NEXTPRESS_CONFIG.links.cliDocs} icon={<BookOpen className="h-4 w-4" aria-hidden />}>
              CLI docs
            </FooterLink>
            <FooterLink href={NEXTPRESS_CONFIG.links.discussions} icon={<MessageSquare className="h-4 w-4" aria-hidden />}>
              Community
            </FooterLink>
            <FooterLink href={NEXTPRESS_CONFIG.links.feedback} icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}>
              Feedback
            </FooterLink>
          </div>
        </footer>
      </div>
    </div>
  );
}

interface InfoPanelProps {
  icon: ReactNode;
  title: string;
  text: string;
}

function InfoPanel({ icon, title, text }: InfoPanelProps) {
  return (
    <article className="rounded-2xl border border-black/10 bg-white/30 p-5 backdrop-blur">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
        {icon}
      </div>
      <h2 className="text-lg font-black tracking-[-0.03em]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-black/65">{text}</p>
    </article>
  );
}

interface FooterLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

function FooterLink({ href, icon, children }: FooterLinkProps) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-white transition hover:bg-white/14"
    >
      {icon}
      {children}
    </a>
  );
}
