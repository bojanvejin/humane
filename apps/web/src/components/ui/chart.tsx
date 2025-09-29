"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  type TooltipProps,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart" // Assuming this is the correct path for your chart components

import { cn } from "@humane/lib/utils"

// Helper function to safely convert value to string
const safeToString = (value: unknown): string => {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }
  return '';
};

// Define the props for the Chart component
interface ChartComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  data: Record<string, any>[];
  chartType?: "line" | "bar" | "area";
  className?: string;
}

const Chart: React.FC<ChartComponentProps> = ({
  config,
  data,
  chartType = "line",
  className,
  ...props
}) => {
  const ChartComponent =
    chartType === "line" ? LineChart : chartType === "bar" ? BarChart : AreaChart;
  const ChartElement =
    chartType === "line" ? Line : chartType === "bar" ? Bar : Area;

  return (
    <ChartContainer config={config} className={cn("min-h-[200px] w-full", className)} {...props}>
      <ChartComponent
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={Object.keys(config).find(key => config[key].axis === 'x')}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: any) => safeToString(value)} // Added type annotation here
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: any) => safeToString(value)} // Added type annotation here
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {Object.entries(config).map(([key, { label, color, type }]) => {
          if (type === chartType) {
            return (
              <ChartElement
                key={key}
                dataKey={key}
                name={label}
                stroke={color}
                fill={color}
                dot={false}
                activeDot={{ r: 6 }}
              />
            );
          }
          return null;
        })}
      </ChartComponent>
    </ChartContainer>
  );
};

export { Chart };