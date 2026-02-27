"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DeviceChartProps {
  types: Record<string, number>;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function DeviceChart({ types }: DeviceChartProps) {
  const data = Object.entries(types).map(([name, value]) => ({
    name: name || "unknown",
    value,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No devices discovered yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(224, 71%, 6%)",
            border: "1px solid hsl(216, 34%, 17%)",
            borderRadius: "8px",
            color: "hsl(213, 31%, 91%)",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "hsl(215, 20%, 55%)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
