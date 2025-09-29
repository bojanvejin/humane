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
  type TooltipProps,
} from 'recharts';

// Explicitly define PayloadItem based on common Recharts payload structure
interface PayloadItem {
  value?: any; // Made optional to match Recharts' Payload type
  name?: string;
  unit?: string;
  dataKey: string | number;
  color?: string;
  fill?: string;
  stroke?: string;
  // Add other properties if needed from Recharts Payload
}

interface ChartConfig {
  [key: string]: {
    label?: string;
    color?: string;
    icon?: ComponentType<{ className?: string; color?: string }>;
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
  // Use TooltipProps<any, any> directly for type compatibility
  const renderTooltipContent = (props: TooltipProps<any, any>) => {
    if (props.active && props.payload && props.payload.length) {
      const item = props.payload[0] as PayloadItem; // Cast to PayloadItem
      // Ensure item.dataKey is treated as string for config lookup
      const dataKey = item.dataKey as string; 
      const { format } = config[dataKey] || {};
      const value = item.value;
      const formattedValue = format ? format(value as number) : value;

      return (
        <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
          <p className="text-sm font-medium">{props.label}</p>
          {props.payload.map((payloadItem: PayloadItem, index: number) => { // Cast to PayloadItem
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