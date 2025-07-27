"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

const THEMES = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    muted: "hsl(210 40% 96%)",
    mutedForeground: "hsl(215.4 16.3% 46.9%)",
    border: "hsl(214.3 31.8% 91.4%)",
    input: "hsl(214.3 31.8% 91.4%)",
    primary: "hsl(222.2 47.4% 11.2%)",
    primaryForeground: "hsl(210 40% 98%)",
    secondary: "hsl(210 40% 96%)",
    secondaryForeground: "hsl(222.2 47.4% 11.2%)",
    accent: "hsl(210 40% 96%)",
    accentForeground: "hsl(222.2 47.4% 11.2%)",
    destructive: "hsl(0 84.2% 60.2%)",
    destructiveForeground: "hsl(210 40% 98%)",
    ring: "hsl(215 20.2% 65.1%)",
    chart: {
      "1": "hsl(12 76% 61%)",
      "2": "hsl(173 58% 39%)",
      "3": "hsl(197 37% 24%)",
      "4": "hsl(43 74% 66%)",
      "5": "hsl(27 87% 67%)",
    },
  },
  dark: {
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    muted: "hsl(217.2 32.6% 17.5%)",
    mutedForeground: "hsl(215 20.2% 65.1%)",
    border: "hsl(217.2 32.6% 17.5%)",
    input: "hsl(217.2 32.6% 17.5%)",
    primary: "hsl(210 40% 98%)",
    primaryForeground: "hsl(222.2 47.4% 11.2%)",
    secondary: "hsl(217.2 32.6% 17.5%)",
    secondaryForeground: "hsl(210 40% 98%)",
    accent: "hsl(217.2 32.6% 17.5%)",
    accentForeground: "hsl(210 40% 98%)",
    destructive: "hsl(0 62.8% 30.6%)",
    destructiveForeground: "hsl(0 85.7% 97.3%)",
    ring: "hsl(217.2 32.6% 17.5%)",
    chart: {
      "1": "hsl(220 70% 50%)",
      "2": "hsl(160 60% 45%)",
      "3": "hsl(30 80% 55%)",
      "4": "hsl(280 65% 60%)",
      "5": "hsl(340 75% 55%)",
    },
  },
} as const

type ThemeType = typeof THEMES.light | typeof THEMES.dark

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps>({
  config: {},
})

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider")
  }
  return context
}

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, children, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ config }}>
        <div ref={ref} {...props}>
          {children}
        </div>
      </ChartContext.Provider>
    )
  }
)
Chart.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const themeConfig = Object.values(config).find((c) => c.theme)?.theme
  const theme: ThemeType = themeConfig ? THEMES.light : THEMES.light
  const colors = Object.values(config)
    .map((c) => c.color)
    .filter(Boolean) as string[]

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          [data-chart="${id}"] {
            --background: ${theme.background};
            --foreground: ${theme.foreground};
            --muted: ${theme.muted};
            --muted-foreground: ${theme.mutedForeground};
            --border: ${theme.border};
            --input: ${theme.input};
            --primary: ${theme.primary};
            --primary-foreground: ${theme.primaryForeground};
            --secondary: ${theme.secondary};
            --secondary-foreground: ${theme.secondaryForeground};
            --accent: ${theme.accent};
            --accent-foreground: ${theme.accentForeground};
            --destructive: ${theme.destructive};
            --destructive-foreground: ${theme.destructiveForeground};
            --ring: ${theme.ring};
            --chart-1: ${theme.chart["1"]};
            --chart-2: ${theme.chart["2"]};
            --chart-3: ${theme.chart["3"]};
            --chart-4: ${theme.chart["4"]};
            --chart-5: ${theme.chart["5"]};
            ${colors
              .map((color, i) => `--chart-${i + 1}: ${color};`)
              .join("\n")}
          }
        `,
      }}
    />
  )
}

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    active?: boolean
    payload?: any[]
    label?: string
    labelFormatter?: (value: string, payload: any[]) => React.ReactNode
    formatter?: (value: any, name: string, props: any, index: number, payload: any) => React.ReactNode
    color?: string
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
    labelClassName?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(String(value || ""), payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload?.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full border-2 border-current",
                            indicator === "dashed" && "border-dashed"
                          )}
                          style={{
                            borderColor: indicatorColor,
                          }}
                        />
                      )
                    )}
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {item.value}
                        </span>
                        {itemConfig?.label && (
                          <span className="text-muted-foreground">
                            {itemConfig.label}
                          </span>
                        )}
                      </div>
                      {item.name && (
                        <span className="text-muted-foreground">
                          {item.name}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltip.displayName = "ChartTooltip"

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    payload?: any[]
    hideIcon?: boolean
    nameKey?: string
  }
>(({ payload, hideIcon, nameKey, className, ...props }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    >
      {payload.map((item: any) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)
        const indicatorColor = item.payload?.fill || item.color

        return (
          <div
            key={item.dataKey}
            className="flex items-center gap-2"
          >
            {!hideIcon && (
              <>
                {itemConfig?.icon ? (
                  <itemConfig.icon />
                ) : (
                  <div
                    className="h-2.5 w-2.5 rounded-full border-2 border-current"
                    style={{
                      borderColor: indicatorColor,
                    }}
                  />
                )}
              </>
            )}
            <span className="text-xs text-muted-foreground">
              {itemConfig?.label || item.name}
            </span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegend.displayName = "ChartLegend"

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const dataKey = (payload as any).dataKey
  const name = (payload as any).name

  return (
    config[key] ??
    config[dataKey] ??
    config[name] ??
    null
  )
}

export {
  Chart,
  ChartStyle,
  ChartTooltip,
  ChartLegend,
  useChart,
  THEMES,
}
