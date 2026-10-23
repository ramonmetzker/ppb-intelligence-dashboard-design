"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { costPoints } from "@/lib/ppb-data";

const AXIS = "#5f6b7d";
const AVG_COST_PER_POINT = 42.8;

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: (typeof costPoints)[number] }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-[12px] shadow-md">
      <p className="font-medium">{p.name}</p>
      <p className="tnum mt-1 text-muted-foreground">
        +{p.gain.toFixed(1)} pts &middot; R$ {p.cost}k &middot; R${" "}
        {(p.cost / p.gain).toFixed(1)}k/pt
      </p>
    </div>
  );
}

export function CostScatter() {
  return (
    <div
      role="img"
      aria-label="Scatter plot of incremental cost against PPB point gain for each material. Memory GH82 has the highest gain and sits below the average cost-per-point line."
      className="h-[260px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#e8ecf1" strokeDasharray="0" />
          <XAxis
            type="number"
            dataKey="gain"
            name="PPB point gain"
            domain={[0, 12]}
            ticks={[0, 3, 6, 9, 12]}
            tickLine={false}
            axisLine={{ stroke: "#d3dae3" }}
            tick={{ fill: AXIS, fontSize: 11 }}
            label={{
              value: "PPB point gain",
              position: "insideBottom",
              offset: -12,
              fill: AXIS,
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="cost"
            name="Incremental cost"
            domain={[0, 480]}
            ticks={[0, 120, 240, 360, 480]}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => `${v}k`}
            tick={{ fill: AXIS, fontSize: 11 }}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 11.2, y: AVG_COST_PER_POINT * 11.2 },
            ]}
            stroke="#8b95a5"
            strokeDasharray="3 3"
          />
          <Tooltip content={<ScatterTooltip />} cursor={false} />
          <Scatter
            data={costPoints}
            fill="#161a21"
            fillOpacity={0.85}
            shape={(props: {
              cx?: number;
              cy?: number;
              payload?: { name: string };
            }) => {
              const highlight = props.payload?.name === "Memory / GH82";
              return (
                <g>
                  {highlight && (
                    <text
                      x={(props.cx ?? 0) - 12}
                      y={(props.cy ?? 0) + 4}
                      textAnchor="end"
                      fontSize={11}
                      fontWeight={600}
                      fill="#0a6b78"
                    >
                      Memory / GH82
                    </text>
                  )}
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={highlight ? 6 : 4}
                    fill={highlight ? "#0a6b78" : "#161a21"}
                    fillOpacity={highlight ? 1 : 0.8}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                </g>
              );
            }}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
