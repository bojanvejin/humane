import React, { ComponentType } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type LegendType,
  type TooltipProps, // Import TooltipProps
} from 'recharts';
// Removed @mui/material imports as per AI_RULES.md
// import { Box, Typography } from '@mui/material'; 

// Define Payload type from TooltipProps
type Payload<TValue, TName> = TooltipProps<TValue, TName>['payload'][number];

interface ChartConfig {
  [key: string]: {
    label?: string;
    color?: string;
    icon?: ComponentType<{ className?: string; color?: string }>; // Added color prop to icon type
    format?: (value: number) => string;
  };
}

interface ChartProps {
  data: any[];
  config: ChartConfig;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
}

const Chart: React.FC<ChartProps> = ({
  data,
  config,
  xAxisLabel,
  yAxisLabel,
  height = 300,
}) => {
  const renderTooltipContent = (props: {
    active?: boolean;
    payload?: Payload<any, any>[];
    label?: string | number;
  }) => {
    if (props.active && props.payload && props.payload.length) {
      const item = props.payload[0];
      // Ensure item.dataKey is treated as string for config lookup
      const dataKey = item.dataKey as string; 
      const { format } = config[dataKey] || {};
      const value = item.value;
      const formattedValue = format ? format(value as number) : value;

      return (
        <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
          <p className="text-sm font-medium">{props.label}</p>
          {props.payload.map((payloadItem: Payload<any, any>, index: number) => {
            const key = payloadItem.dataKey as string;
            const itemConfig = config[key];
            if (!itemConfig) return null;

            const itemValue = itemConfig.format ? itemConfig.format(payloadItem.value as number) : payloadItem.value;

            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-1">
                  {itemConfig.icon && <itemConfig.icon className="h-3 w-3" color={itemConfig.color} />}
                  <span className="text-muted-foreground">{itemConfig.label || key}:</span>
                </div>
                <span className="font-semibold" style={{ color: itemConfig.color }}>{itemValue}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <Tooltip content={renderTooltipContent} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }} />
        <Legend />
        {Object.entries(config).map(([key, seriesConfig]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={seriesConfig.color || 'hsl(var(--primary))'}
            activeDot={{ r: 8 }}
            name={seriesConfig.label || key}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export { Chart };