import type { ReactNode } from "react";
import TopNav from "./top-nav";
import Footer from "./footer";

type AppShellProps = {
  children: ReactNode;
  active?: string;
  title?: string;
  description?: string;
  hideTitle?: boolean;
};

export default function AppShell({ children, active, title, description, hideTitle }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav active={active} />
      <main id="main-content" className="px-container px-main-stack">
        {!hideTitle && (title || description) && (
          <div className="px-section px-stack-2">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
              PerformX
            </div>
            {title && <h1 className="text-4xl text-white">{title}</h1>}
            {description && <p className="max-w-2xl text-white/70">{description}</p>}
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}
