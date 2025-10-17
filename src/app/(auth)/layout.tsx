export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="mt-12 md:mt-0">{children}</div>;
}
