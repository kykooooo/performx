import Link from "next/link";
import type { ReactNode } from "react";
import { BoltIcon } from "./icons";

type FeedbackStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  tone?: "default" | "error" | "success";
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

const TONE_CLASSES: Record<NonNullable<FeedbackStateProps["tone"]>, string> = {
  default: "text-white/70",
  error: "text-[color:var(--px-danger)]",
  success: "text-[color:var(--px-success)]",
};

export function FeedbackState({
  icon = <BoltIcon className="h-7 w-7 text-[color:var(--px-accent)]" />,
  title,
  description,
  tone = "default",
  actionLabel,
  actionHref,
  onAction,
}: FeedbackStateProps) {
  return (
    <div className="px-feedback px-stack-2">
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        {icon}
      </div>
      <div className="relative px-stack-1">
        <h3 className="text-xl text-white">{title}</h3>
        <p className={`text-sm ${TONE_CLASSES[tone]}`}>{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="relative px-button-ghost mx-auto">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <button type="button" onClick={onAction} className="relative px-button-ghost mx-auto">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingState({ title = "Chargement", description = "Récupération des données..." }: { title?: string; description?: string }) {
  return (
    <div className="px-feedback px-stack-2">
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <span className="px-spinner" />
      </div>
      <div className="relative px-stack-1">
        <h3 className="text-xl text-white">{title}</h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      <div className="relative mx-auto w-full max-w-md px-stack-1">
        <div className="px-skeleton h-3 w-3/4" />
        <div className="px-skeleton h-3 w-full" />
      </div>
    </div>
  );
}
