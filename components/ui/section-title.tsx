export function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold flex items-center gap-2 font-[family-name:var(--font-mono)]">
        <span className="text-xl">{icon}</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-white/40 mt-1 ml-8">{subtitle}</p>
      )}
    </div>
  );
}
