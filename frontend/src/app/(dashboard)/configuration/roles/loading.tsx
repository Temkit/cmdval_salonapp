export default function Loading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="h-32 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
      </div>
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}
