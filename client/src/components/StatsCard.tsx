/**
 * StatsCard.tsx – Summary card used on the Admin Dashboard.
 */

interface StatsCardProps {
  label: string;
  value: number;
  accent?: string;
}

export function StatsCard({ label, value, accent }: StatsCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}
