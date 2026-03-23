export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="!ml-0 fixed inset-0 z-50">
      {children}
    </div>
  );
}
