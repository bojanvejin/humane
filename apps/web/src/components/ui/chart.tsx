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
import { cn } from "@humane/lib/utils"

// Define ChartConfig type
export type ChartConfig = {
  [k: string]: {
    label?: string;
    color?: string;
    icon?: React.ComponentType<{ className?: string }>;
    type?: "line" | "bar" | "area";
    axis?: "x" | "y";
  };
};

// Define ChartContainer
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center", className)}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
);
ChartContainer.displayName = "ChartContainer";

// Define ChartLegend
interface ChartLegendProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> { // Omit content to avoid conflict
  legendContent?: React.ReactNode; // Renamed to avoid conflict
}

const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(
  ({ legendContent, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex justify-center gap-4 p-4", className)} {...props}>
      {legendContent}
    </div>
  )
);
ChartLegend.displayName = "ChartLegend";

// Define ChartLegendContent
interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig;
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ config, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex gap-2", className)} {...props}>
      {config && Object.entries(config).map(([key, { label, color }]) => (
        <div key={key} className="flex items-center gap-1">
          <span className={cn("h-3 w-3 rounded-full", color)} style={{ backgroundColor: color }} />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
);
ChartLegendContent.displayName = "ChartLegendContent";

// Define ChartTooltip
interface ChartTooltipProps extends TooltipProps<any, any> {
  hideLabel?: boolean;
}

const ChartTooltip = ({ ...props }: ChartTooltipProps) => { // Removed content from destructuring
  return (
    <Tooltip
      content={({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string | number }) => {
        if (active && payload && payload.length) {
          return (
            <div className="rounded-lg border bg-background p-2 text-sm shadow-md">
              {props.hideLabel ? null : <div className="font-medium">{label}</div>}
              {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{entry.name}:</span>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          );
        }
        return null;
      }}
      {...props}
    />
  );
};
ChartTooltip.displayName = "ChartTooltip";

// Define ChartTooltipContent
interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideLabel?: boolean;
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ hideLabel, className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-background p-2 text-sm shadow-md", className)} {...props}>
      {/* Content will be rendered by Recharts Tooltip's formatter */}
    </div>
  )
);
ChartTooltipContent.displayName = "ChartTooltipContent";


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
          dataKey={Object.keys(config).find(key => config[key]?.axis === 'x')}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: any) => safeToString(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: any) => safeToString(value)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <ChartLegend content={<ChartLegendContent config={config} />} />
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

export { Chart, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent };