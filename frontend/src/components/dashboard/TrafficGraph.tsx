"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Generate mock time-series data for the chart
function generateTrafficData() {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      inbound: Math.floor(Math.random() * 50 + 10),
      outbound: Math.floor(Math.random() * 30 + 5),
      suspicious: Math.floor(Math.random() * 5),
    });
  }
  return data;
}

export default function TrafficGraph() {
  const data = generateTrafficData();

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="inbound" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outbound" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="suspicious" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 34%, 17%)" />
        <XAxis
          dataKey="time"
          stroke="hsl(215, 20%, 45%)"
          fontSize={10}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(215, 20%, 45%)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(224, 71%, 6%)",
            border: "1px solid hsl(216, 34%, 17%)",
            borderRadius: "8px",
            color: "hsl(213, 31%, 91%)",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="inbound"
          stroke="#3b82f6"
          fill="url(#inbound)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="outbound"
          stroke="#8b5cf6"
          fill="url(#outbound)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="suspicious"
          stroke="#ef4444"
          fill="url(#suspicious)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
