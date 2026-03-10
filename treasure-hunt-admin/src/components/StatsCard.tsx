type Props = {
  title: string;
  value: number | string;
};

export default function StatsCard({ title, value }: Props) {
  return (
    <div className="bg-white shadow rounded p-6 w-64">
      {" "}
      <h3 className="text-gray-500 text-sm">{title}</h3>{" "}
      <p className="text-2xl font-bold mt-2">{value}</p>{" "}
    </div>
  );
}
