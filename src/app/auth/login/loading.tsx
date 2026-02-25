export default function LoginLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-6 p-8">
        <div className="px-skeleton h-8 w-40" />
        <div className="px-skeleton h-4 w-60" />
        <div className="space-y-4">
          <div className="px-skeleton h-12 w-full" />
          <div className="px-skeleton h-12 w-full" />
          <div className="px-skeleton h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
