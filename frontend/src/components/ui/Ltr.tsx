// Keeps IPs, MACs, ports and CIDRs left-to-right inside Hebrew text.
export default function Ltr({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={`font-mono ${className}`}>
      {children}
    </bdi>
  );
}
