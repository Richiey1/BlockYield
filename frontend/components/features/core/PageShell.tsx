type Props = {
  children: React.ReactNode;
};

export function PageShell({ children }: Props) {
  return (
    <div className="bg-gradient-to-b from-[#0b1221] via-[#0d1529] to-[#090b12] pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </div>
  );
}
