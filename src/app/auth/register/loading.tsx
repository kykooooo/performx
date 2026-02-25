export default function RegisterLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-6 p-8">
        <div className="px-skeleton h-8 w-48" />
        <div className="px-skeleton h-4 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="px-skeleton h-32 w-full rounded-2xl" />
          <div className="px-skeleton h-32 w-full rounded-2xl" />
          <div className="px-skeleton h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
