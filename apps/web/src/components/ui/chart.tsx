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
  value?: any;
  name?: string;
  unit?: React.ReactNode;
  dataKey?: string | number | null; // Updated to include null
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

// Helper function to safely convert a value to string, handling null/undefined
const safeToString = (value: any): string => {
  if (value == null) {
    return ''; // Return empty string for null or undefined
  }
  return String(value);
};

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
      // Ensure the first payload item exists and is not null/undefined
      const firstPayloadItem = props.payload[0];
      if (firstPayloadItem == null) {
        console.warn("Chart Tooltip: First payload item is null or undefined. Skipping tooltip content.");
        return null;
      }
      
      const item = firstPayloadItem as PayloadItem;
      
      // Safely get dataKey for the first item
      const initialDataKey = item.dataKey;
      // If the primary dataKey is null/undefined, don't render tooltip
      if (initialDataKey == null) {
        console.warn("Chart Tooltip: First payload item's dataKey is null or undefined. Skipping tooltip content.");
        return null;
      }
      const dataKey = safeToString(initialDataKey); // Use safeToString

      const { format } = config[dataKey] || {};
      const value = item.value;
      // Apply safeToString here as well, and check type before calling format
      const formattedValue = format && typeof value === 'number' ? format(value) : safeToString(value);

      return (
        <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
          <p className="text-sm font-medium">{safeToString(props.label)}</p> {/* Use safeToString for label */}
          {props.payload.map((payloadItem: PayloadItem | null | undefined, index: number) => { // Allow null/undefined payload items
            if (payloadItem == null) return null; // Check if the item itself is null/undefined

            const currentPayloadDataKey = payloadItem.dataKey;
            if (currentPayloadDataKey == null) return null; // Skip this payload item if its dataKey is null/undefined
            const key = safeToString(currentPayloadDataKey); // Use safeToString

            const itemConfig = config[key];
            if (!itemConfig) return null;

            // Apply safeToString here, and check type before calling format
            const itemValue = itemConfig.format && typeof payloadItem.value === 'number'
              ? itemConfig.format(payloadItem.value)
              : safeToString(payloadItem.value);

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
        <XAxis 
          dataKey="name" 
          stroke="hsl(var(--muted-foreground))" 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => safeToString(value)} // Added tickFormatter here
        />
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