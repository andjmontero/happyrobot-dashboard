import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { SentimentCount } from "../types";

const COLORS: Record<string, string> = {
  positive: "#1D9E75",
  neutral: "#888780",
  negative: "#E24B4A",
};

interface Props {
  data: SentimentCount[];
}

export default function SentimentChart({ data }: Props) {
  const formatted = data.map((d) => ({
    name: d.sentiment,
    value: d._count,
    fill: COLORS[d.sentiment] ?? "#888780",
  }));

  const total = formatted.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={formatted} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
              {formatted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
              formatter={(value) => [`${Number(value)} (${total > 0 ? ((Number(value) / total) * 100).toFixed(0) : 0}%)`, "calls"]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{total}</p>
          <p
            style={{
              fontSize: 10,
              margin: 0,
              opacity: 0.5,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            calls
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1">
        {["positive", "neutral", "negative"].map((key) => {
          const item = formatted.find((d) => d.name === key);
          const count = item?.value ?? 0;
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="inline-block rounded-full flex-shrink-0" style={{ width: 8, height: 8, backgroundColor: COLORS[key] }} />
              <span className="text-xs text-muted-foreground capitalize">{key}</span>
              <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
