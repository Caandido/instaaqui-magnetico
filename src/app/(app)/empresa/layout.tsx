import { EmpresaTabs } from "@/components/empresa-tabs";

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <EmpresaTabs />
      {children}
    </div>
  );
}
