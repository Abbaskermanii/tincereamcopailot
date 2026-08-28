"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function OrdersChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
          <XAxis dataKey="day" fontSize={11} />
          <YAxis allowDecimals={false} fontSize={11} width={28} />
          <Tooltip
            contentStyle={{ borderRadius: 14, fontFamily: "inherit" }}
            formatter={(v) => [String(v), "سفارش"]}
          />
          <Line type="monotone" dataKey="count" stroke="#31547A" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
