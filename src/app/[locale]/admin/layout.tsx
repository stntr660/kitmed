export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin pages should not include the main site header/footer
  // The AdminLayout component handles its own layout
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}