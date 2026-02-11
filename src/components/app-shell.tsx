import type { ReactNode } from "react";
import TopNav from "./top-nav";

type AppShellProps = {
  children: ReactNode;
  active?: string;
  title?: string;
  description?: string;
};

export default function AppShell({ children, active, title, description }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <TopNav active={active} />
      <main className="px-container space-y-8 py-10">
        {(title || description) && (
          <div className="px-section space-y-3">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/40">
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
              PerformX
            </div>
            {title && <h1 className="text-4xl text-white">{title}</h1>}
            {description && <p className="max-w-2xl text-white/60">{description}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
