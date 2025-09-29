"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { type ChartConfig } from "@/components/ui/chart"

import { cn } from "@/lib/utils"

// Workaround for https://github.com/recharts/recharts/issues/3615
function set  ChartStyle(config: ChartConfig) {
  return {
    "[data-chart]": {
      "--theme-color": `var(--chart-${config.index || 1})`,
      ...Object.entries(config.colors || {}).map(([key, value]) => ({
        [`--color-${key}`]: value,
      })),
    },
  } as React.CSSProperties
}

type ChartContextProps = {
  config: ChartConfig
} & React.ComponentPropsWithoutRef<"div">

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <Chart />")
  }

  return context
}

const Chart = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    config: ChartConfig
  }
>(({ config, className, children, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn("flex h-full w-full flex-col", className)}
        style={setChartStyle(config)}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
})
Chart.displayName = "Chart"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    id?: string
    children: React.ComponentPropsWithoutRef<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, children, ...props }, ref) => {
  const { config } = useChart()

  return (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      style={
        {
          "--theme-color": `hsl(var(--chart-${config.index || 1}))`,
        } as React.CSSProperties
      }
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer
        id={id}
        width="100%"
        height="100%"
      >
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip

type ChartTooltipContentProps = React.ComponentPropsWithoutRef<
  typeof RechartsPrimitive.Tooltip
> & {
  hideLabel?: boolean
  hideIndicator?: boolean
  nameKey?: string
  labelKey?: string
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      nameKey,
      labelKey,
      ...props
    },
    ref
  ) => {
    const { config } = useChart()
    const customTooltip =
      config.tooltip?.render &&
      config.tooltip.render({ active, payload, label: payload?.[0]?.payload[labelKey || "label"] })

    if (active && payload && payload.length) {
      return (
        <div
          ref={ref}
          className={cn(
            "grid min-w-[130px] items-start text-xs border border-border bg-background p-2 shadow-lg",
            className
          )}
          {...props}
        >
          {!hideLabel && payload[0]?.name && (
            <div className="row-span-2 grid gap-0.5">
              <div className="font-medium text-muted-foreground">
                {labelKey ? payload[0].payload[labelKey] : payload[0].payload.label}
              </div>
              {customTooltip}
            </div>
          )}
          <div className="grid gap-1.5">
            {payload.map((item: { dataKey?: string; name?: string; value?: any; color?: string; payload?: any }, index: number) => { // Explicitly type item
              const key = `${nameKey || item.name || item.dataKey || "value"}`
              const itemConfig = item.dataKey ? config[item.dataKey] : undefined
              const indicatorColor = itemConfig?.color || config.colors?.[key] || item.color

              return (
                <div
                  key={item.dataKey || index}
                  className="flex items-center gap-2"
                >
                  {hideIndicator ? null : indicator === "dot" ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: indicatorColor,
                      }}
                    />
                  ) : (
                    <div
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: indicatorColor,
                      }}
                    />
                  )}
                  {item.name && (
                    <span className="text-muted-foreground">
                      {itemConfig?.label || item.name}:
                    </span>
                  )}
                  <span className="font-medium text-foreground">
                    {itemConfig?.format
                      ? itemConfig.format(item.value)
                      : item.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return null
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

type ChartLegendContentProps = React.ComponentPropsWithoutRef<
  typeof RechartsPrimitive.Legend
> & {
  hideIndicator?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, hideIndicator = false, payload, nameKey, ...props },
    ref
  ) => {
    const { config } = useChart()

    if (!payload || !payload.length) return null

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center justify-center gap-4",
          className
        )}
        {...props}
      >
        {payload.map((item: { value?: string; dataKey?: string; color?: string }) => { // Explicitly type item
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = item.dataKey ? config[item.dataKey] : undefined
          const indicatorColor = item.color || itemConfig?.color || config.colors?.[key]

          return (
            <div
              key={item.value}
              className="flex items-center gap-1.5"
            >
              {hideIndicator ? null : (
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: indicatorColor,
                  }}
                />
              )}
              {itemConfig?.label || item.value}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}