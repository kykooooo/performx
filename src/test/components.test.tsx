import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

// Mock next/link for all component tests
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    <img alt={alt} {...props} />
  ),
}));

// ── Breadcrumbs ──

import Breadcrumbs from "@/components/breadcrumbs";

describe("Breadcrumbs", () => {
  it("affiche les éléments avec des liens", () => {
    render(
      <Breadcrumbs items={[
        { label: "Accueil", href: "/" },
        { label: "Coachs", href: "/coach" },
        { label: "Jean Dupont" },
      ]} />,
    );
    expect(screen.getByText("Accueil")).toBeInTheDocument();
    expect(screen.getByText("Coachs")).toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
  });

  it("le dernier élément n'est pas un lien", () => {
    render(
      <Breadcrumbs items={[
        { label: "Accueil", href: "/" },
        { label: "Jean Dupont" },
      ]} />,
    );
    const lastItem = screen.getByText("Jean Dupont");
    expect(lastItem.tagName).not.toBe("A");
    expect(lastItem).toHaveAttribute("aria-current", "page");
  });

  it("les éléments intermédiaires sont des liens", () => {
    render(
      <Breadcrumbs items={[
        { label: "Accueil", href: "/" },
        { label: "Coachs", href: "/coach" },
        { label: "Profil" },
      ]} />,
    );
    const link = screen.getByText("Accueil");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/");
  });

  it("a un aria-label de navigation", () => {
    render(<Breadcrumbs items={[{ label: "Accueil", href: "/" }]} />);
    expect(screen.getByLabelText("Fil d'Ariane")).toBeInTheDocument();
  });
});

// ── Notice ──

import { Notice, FieldError } from "@/components/notice";

describe("Notice", () => {
  it("n'affiche rien quand notice est null", () => {
    const { container } = render(<Notice notice={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("affiche une erreur avec le bon rôle", () => {
    render(<Notice notice={{ type: "error", text: "Erreur survenue" }} />);
    const notice = screen.getByRole("alert");
    expect(notice).toHaveTextContent("Erreur survenue");
  });

  it("affiche un succès avec le bon rôle", () => {
    render(<Notice notice={{ type: "success", text: "Opération réussie" }} />);
    const notice = screen.getByRole("alert");
    expect(notice).toHaveTextContent("Opération réussie");
  });
});

describe("FieldError", () => {
  it("n'affiche rien sans erreur", () => {
    const { container } = render(<FieldError error="" />);
    expect(container.innerHTML).toBe("");
  });

  it("affiche le message d'erreur", () => {
    render(<FieldError error="Ce champ est requis" />);
    expect(screen.getByText("Ce champ est requis")).toBeInTheDocument();
  });

  it("a un rôle alert", () => {
    render(<FieldError error="Erreur" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

// ── FeedbackState ──

import { FeedbackState, LoadingState } from "@/components/feedback-state";

describe("FeedbackState", () => {
  it("affiche le titre et la description", () => {
    render(<FeedbackState title="Titre test" description="Description test" />);
    expect(screen.getByText("Titre test")).toBeInTheDocument();
    expect(screen.getByText("Description test")).toBeInTheDocument();
  });

  it("affiche un lien d'action quand fourni", () => {
    render(
      <FeedbackState
        title="Test"
        description="Desc"
        actionLabel="Voir plus"
        actionHref="/more"
      />,
    );
    const link = screen.getByText("Voir plus");
    expect(link).toHaveAttribute("href", "/more");
  });

  it("utilise role=alert pour le ton erreur", () => {
    render(<FeedbackState title="Erreur" description="Quelque chose" tone="error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("utilise role=status pour le ton par défaut", () => {
    render(<FeedbackState title="Info" description="Quelque chose" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("LoadingState", () => {
  it("affiche le titre et la description par défaut", () => {
    render(<LoadingState />);
    expect(screen.getByText("Chargement")).toBeInTheDocument();
    expect(screen.getByText("Récupération des données...")).toBeInTheDocument();
  });

  it("accepte des props personnalisées", () => {
    render(<LoadingState title="Patientez" description="En cours..." />);
    expect(screen.getByText("Patientez")).toBeInTheDocument();
    expect(screen.getByText("En cours...")).toBeInTheDocument();
  });

  it("a un rôle status", () => {
    render(<LoadingState />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

// ── Skeleton ──

import { Skeleton, SkeletonCard, SkeletonPlayerCard } from "@/components/skeleton";

describe("Skeleton", () => {
  it("rend un div avec la classe px-skeleton", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector(".px-skeleton")).toBeInTheDocument();
  });

  it("accepte une className supplémentaire", () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("px-skeleton");
    expect(el.className).toContain("h-4");
  });
});

describe("SkeletonCard", () => {
  it("rend sans erreur", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelectorAll(".px-skeleton").length).toBeGreaterThan(0);
  });
});

describe("SkeletonPlayerCard", () => {
  it("rend sans erreur", () => {
    const { container } = render(<SkeletonPlayerCard />);
    expect(container.querySelectorAll(".px-skeleton").length).toBeGreaterThan(0);
  });
});
