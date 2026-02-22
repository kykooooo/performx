export type NoticeData = { type: "success" | "error"; text: string } | null;

export function Notice({ notice }: { notice: NoticeData }) {
  if (!notice) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border px-3 py-2 text-xs ${
        notice.type === "success"
          ? "border-[color:var(--px-success)]/40 bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]"
          : "border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/15 text-[color:var(--px-danger)]"
      }`}
    >
      {notice.text}
    </div>
  );
}

export function FieldError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-[color:var(--px-danger)]">
      {error}
    </p>
  );
}
