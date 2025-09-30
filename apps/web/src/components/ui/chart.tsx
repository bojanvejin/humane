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
  Tooltip,
  XAxis,
  YAxis,
  Legend, // Import Legend
} from 'recharts';
import { cn } from "@humane/lib/utils"

// Define a type for the chart config
type ChartConfig = {
  [k: string]: {
    label?: string
    color?: string
    icon?: React.ComponentType<{ className?: string }>
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <Chart />")
  }

  return context
}

type ChartProps = React.ComponentProps<typeof ResponsiveContainer> & {
  config: ChartConfig
  children?: React.ReactNode
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, className, children, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn("h-[400px] w-full", className)}
        >
          <ResponsiveContainer {...props}>
            {children}
          </ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)
Chart.displayName = "Chart"

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; name?: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    const { config } = useChart()
    const tooltipPayload = payload.filter((item: { dataKey?: string; name?: string }) => item.dataKey && item.name) // Explicitly type item

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">{label}</span>
            {tooltipPayload.map((item, index) => (
              <div
                key={item.dataKey}
                className="flex items-center justify-between space-x-2"
              >
                <span className="text-muted-foreground text-sm">
                  {config[item.dataKey]?.label || item.name}
                </span>
                <span className="font-medium text-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}

ChartTooltip.displayName = "ChartTooltip"

export {
  Chart,
  ChartTooltip,
  ChartContext,
  useChart,
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
}