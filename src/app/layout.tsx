import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Gestão de Processos | Licenciamento",
  description: "Carteira, histórico e produção das coordenadorias",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
