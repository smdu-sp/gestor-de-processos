import Link from "next/link";
import { Actor } from "@/lib/auth";
import { Logout } from "./widgets";
import {
  LayoutDashboard,
  FolderOpen,
  UserRound,
  ListChecks,
  ChartNoAxesCombined,
  Settings,
  Layers,
  Mail,
  Archive,
  Workflow,
} from "lucide-react";
const links = [
  ["/", "Visão geral", LayoutDashboard],
  ["/processos", "Processos", FolderOpen],
  ["/processos?mine=true", "Minha carteira", UserRound],
  ["/atividades", "Minhas atividades", ListChecks],
  ["/grupos", "Grupos", Layers],
  ["/oficios", "Ofícios", Mail],
  ["/arquivo", "Arquivo físico", Archive],
  ["/relatorios", "Produção e relatórios", ChartNoAxesCombined],
] as const;
export function Shell({
  user,
  children,
  active,
}: {
  user: Actor;
  children: React.ReactNode;
  active: string;
}) {
  return (
    <div className="app">
      <a className="skip" href="#content">
        Ir para conteúdo
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Workflow size={30} />
          <span>
            Gestão de
            <br />
            <strong>Processos</strong>
          </span>
        </Link>
        <div className="nav-label">LICENCIAMENTO</div>
        <nav>
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={active === label ? "selected" : ""}
              aria-current={active === label ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <Link
              href="/integracoes"
              className={active === "Integrações" ? "selected" : ""}
            >
              <Settings size={19} />
              Integrações
            </Link>
          )}
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Ambiente operacional
          <br />
          <small>BI + SEI · leitura integrada</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            SMUL <span className="muted">/</span> Controle de licenciamento
          </span>
          <div>
            <span>
              {user.name} <small className="muted">· {user.role}</small>
            </span>
            <Logout />
          </div>
        </header>
        <main id="content">
          {process.env.DEMO_MODE === "true" && (
            <div className="demo">
              Ambiente demonstrativo · registros fictícios · integrações reais
              dependem de configuração
            </div>
          )}
          {children}
        </main>
        <footer>Gestão de processos · Datas em America/Sao_Paulo</footer>
      </div>
    </div>
  );
}
