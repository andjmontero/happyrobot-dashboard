import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CallRecord } from "../types";

interface Props {
  calls: CallRecord[];
  days?: number;
}

export default function VolumeChart({ calls, days = 7 }: Props) {
  const data = useMemo(() => {
    const buckets: { label: string; date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.push({
        label: days <= 7 ? d.toLocaleDateString("en-US", { weekday: "short" }) : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        date: d.toISOString().slice(0, 10),
        count: 0,
      });
    }
    calls.forEach((c) => {
      const callDate = c.created_at.slice(0, 10);
      const bucket = buckets.find((b) => b.date === callDate);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [calls, days]);

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#378ADD" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,135,128,0.15)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(value) => [value, "calls"]} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#378ADD"
          strokeWidth={2}
          fill="url(#volumeGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#378ADD", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
