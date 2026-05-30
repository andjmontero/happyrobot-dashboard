import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { OutcomeCount } from "../types";

const COLORS: Record<string, string> = {
  booked: "#639922",
  rejected: "#E24B4A",
  no_load: "#EF9F27",
  ineligible: "#888780",
  abandoned: "#D4537E",
};

interface Props {
  data: OutcomeCount[];
}

export default function OutcomeChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d._count, 0);

  const formatted = data.map((d) => ({
    name: d.outcome.replace("_", " "),
    count: d._count,
    outcome: d.outcome,
    pct: total > 0 ? `${((d._count / total) * 100).toFixed(1)}%` : "0%",
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 20, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,135,128,0.15)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
          cursor={{ fill: "rgba(136,135,128,0.08)" }}
          formatter={(value, _, props) => [`${value} calls (${props.payload.pct})`, "outcome"]}
        />
        <Bar
          dataKey="count"
          radius={[4, 4, 0, 0]}
          shape={(props: any) => {
            const { x, y, width, height, outcome } = props;
            return <rect x={x} y={y} width={width} height={height} fill={COLORS[outcome] ?? "#888780"} rx={4} />;
          }}
        >
          <LabelList dataKey="pct" position="top" style={{ fontSize: 11, fontWeight: 600, fill: "#555" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
