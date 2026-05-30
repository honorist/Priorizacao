import { useEffect, useRef } from "react"
import * as echarts from "echarts/core"
import { SankeyChart as SankeySeries } from "echarts/charts"
import { TooltipComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([SankeySeries, TooltipComponent, CanvasRenderer])

export interface SankeyNode {
  name: string
  depth?: number
  itemStyle?: { color?: string }
}
export interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyChartProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  height?: number
  valueFormatter?: (n: number) => string
  /** Mapeia o `name` interno de um nó para o rótulo exibido. */
  labelFor?: (name: string) => string
  /** 0 = mantém a ordem dos dados (sem reposicionar para reduzir cruzamentos). */
  layoutIterations?: number
}

type TooltipParam = {
  dataType?: string
  name?: string
  data: { source?: string; target?: string; value?: number }
}

export function SankeyChart({
  nodes,
  links,
  height = 420,
  valueFormatter,
  labelFor,
  layoutIterations,
}: SankeyChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chartRef.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const fmt = valueFormatter ?? ((n: number) => String(n))
    const disp = labelFor ?? ((name: string) => name)
    chart.setOption(
      {
        tooltip: {
          trigger: "item",
          triggerOn: "mousemove",
          formatter: (params: unknown) => {
            const p = params as TooltipParam
            if (p.dataType === "edge") {
              return `${disp(p.data.source ?? "")} → ${disp(
                p.data.target ?? "",
              )}<br/><b>${fmt(p.data.value ?? 0)}</b>`
            }
            return `<b>${disp(p.name ?? "")}</b>`
          },
        },
        series: [
          {
            type: "sankey",
            nodeAlign: "left",
            // mais espaço à direita para os nomes (coluna de projetos)
            left: 8,
            top: 12,
            bottom: 12,
            right: 220,
            layoutIterations: layoutIterations ?? 32,
            emphasis: { focus: "adjacency" },
            data: nodes,
            links,
            nodeGap: 10,
            label: {
              fontSize: 11,
              color: "#334155",
              // quebra o nome em várias linhas em vez de cortar
              width: 200,
              overflow: "break",
              formatter: (params: unknown) =>
                disp((params as { name?: string }).name ?? ""),
            },
            lineStyle: { color: "gradient", curveness: 0.5, opacity: 0.45 },
          },
        ],
      },
      true,
    )
  }, [nodes, links, valueFormatter, labelFor, layoutIterations])

  return <div ref={ref} style={{ height, width: "100%" }} />
}
