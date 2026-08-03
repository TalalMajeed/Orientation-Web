export default function HrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-surface text-fg">{children}</div>;
}
