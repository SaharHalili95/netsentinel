// A scrollable area that keyboard users can focus and scroll.
export default function ScrollRegion({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className={`overflow-x-auto ${className}`}>
      {children}
    </div>
  );
}
