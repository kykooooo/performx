import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import RegisterPlayerPage from "@/app/auth/register/player/register-player-client";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

describe("RegisterPlayerPage", () => {
  it("bloque l'accès à l'étape 2 si les CGU ne sont pas acceptées", () => {
    render(<RegisterPlayerPage />);

    fireEvent.change(screen.getByPlaceholderText("Prénom"), { target: { value: "Jean" } });
    fireEvent.change(screen.getByPlaceholderText("Nom"), { target: { value: "Dupont" } });
    fireEvent.change(screen.getByPlaceholderText("Adresse e-mail"), { target: { value: "jean@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), { target: { value: "secret123" } });
    fireEvent.change(screen.getByPlaceholderText("Confirmer le mot de passe"), { target: { value: "secret123" } });

    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

    expect(screen.getByText("Tu dois accepter les conditions pour continuer.")).toBeInTheDocument();
  });
});
