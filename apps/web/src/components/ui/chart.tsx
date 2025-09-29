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
  Legend,
  type TooltipProps,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@humane/lib/utils"

// Helper to safely convert value to string for tickFormatter
const safeToString = (value: unknown): string => {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }
  return '';
};

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, children, className, ...props }, ref) => {
    const chartProps = React.useMemo(() => {
      const chartValues = Object.values(config).filter(
        (entry) => entry.type === "value"
      )
      if (!chartValues.length) return null

      const content = chartValues[0]?.content
      if (typeof content !== "function") return null

      return {
        content,
        formatter: chartValues[0]?.formatter,
      }
    }, [config])

    const hasData = React.Children.toArray(children).some((child) => {
      if (React.isValidElement(child) && "data" in child.props) {
        return Array.isArray(child.props.data) && child.props.data.length > 0
      }
      return false
    })

    return (
      <div
        ref={ref}
        className={cn("flex h-[400px] w-full flex-col", className)}
        {...props}
      >
        <ChartContainer config={config} className="h-full w-full">
          {children}
          {hasData && (
            <>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={chartProps?.formatter} />} />
              <ChartLegend content={<ChartLegendContent />} />
            </>
          )}
        </ChartContainer>
      </div>
    )
  }
)
Chart.displayName = "Chart"

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  safeToString, // Export safeToString
}