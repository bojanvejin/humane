"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend, // Import Legend
} from 'recharts';
import { cn } from "@humane/lib/utils"

// Define ChartConfig type
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
  children: React.ReactNode
}

function Chart({ config, className, children, ...props }: ChartProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("h-[400px] w-full", className)}>
        <ResponsiveContainer {...props}>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

type ChartContainerProps = {
  id?: string
  children: React.ReactNode
  className?: string
} & React.ComponentProps<typeof Chart>

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const newId = React.useId()
    const chartId = `chart-${id || newId}`

    return (
      <Chart config={config} className={className} id={chartId} ref={ref} {...props}>
        {children}
      </Chart>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

type ChartTooltipProps = React.ComponentProps<typeof Tooltip> & {
  hideLabel?: boolean
  hideIndicator?: boolean
  is(segment: string): boolean
}

const ChartTooltip = ({
  active,
  payload,
  label,
  className,
  coordinate,
  hideLabel = false,
  hideIndicator = false,
  is = () => false,
}: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const { config } = useChart()
  const tooltipPayload = payload.filter((item) => item.dataKey && item.name)

  if (!tooltipPayload.length) {
    return null
  }

  return (
    <div
      className={cn(
        "grid min-w-[130px] items-center justify-items-stretch whitespace-nowrap rounded-md border border-border bg-background/95 p-2 text-xs shadow-xl backdrop-blur-sm",
        className
      )}
    >
      {!hideLabel && label ? (
        <div className="mb-1 font-medium">{label}</div>
      ) : null}
      {tooltipPayload.map((item: any) => {
        const key = item.dataKey as keyof ChartConfig

        const indicatorColor = config[key]?.color

        return (
          <div
            key={item.dataKey}
            className={cn(
              "flex items-center justify-between gap-4",
              is(item.dataKey as string) && "text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              {!hideIndicator ? (
                <div
                  className={cn("h-2 w-2 shrink-0 rounded-full", indicatorColor)}
                />
              ) : null}
              <span className="text-muted-foreground">{config[key]?.label || item.name}</span>
            </div>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

type ChartTooltipContentProps = React.ComponentProps<typeof ChartTooltip>

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ ...props }, ref) => {
  return <ChartTooltip ref={ref} {...props} />
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
}