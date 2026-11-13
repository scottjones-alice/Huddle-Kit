export function NoAccess({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold">No access</h1>
      <p className="text-muted-foreground text-sm">
        Your account is not a member of {title}, or your role does not include
        it.
      </p>
    </div>
  );
}
