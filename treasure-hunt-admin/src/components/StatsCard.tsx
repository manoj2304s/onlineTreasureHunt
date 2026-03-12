type Props = {
  title: string;
  value: number | string;
  valueClassName?: string;
};

export default function StatsCard({ title, value, valueClassName }: Props) {
  return (
    <div className="panel rise-in p-5">
      <h3 className="text-xs uppercase tracking-[0.12em] text-[#5a564e]">{title}</h3>
      <p className={`mt-2 text-3xl font-bold text-[#1f1d1a] ${valueClassName || ""}`}>
        {value}
      </p>
    </div>
  );
}
