<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  chartData: Array,
  title: {
    type: String,
    default: 'Stock Trend'
  },
  xAxisName: {
    type: String,
    default: 'Date'
  },
  yAxisName: {
    type: String,
    default: 'Value'
  }
})

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null

const drawChart = () => {
  if (!chartInstance || !props.chartData?.length) return

  const grouped = {}
  props.chartData.forEach(item => {
    const year = item.x ? String(item.x) : ''
    const value = isNaN(item.v) ? 0 : item.v
    var stockCode = item.stockName;
    if (!grouped[stockCode]) grouped[stockCode] = []
    grouped[stockCode].push([year, value])
  })

  const selected = {}
  const stockCodes = Object.keys(grouped)
  stockCodes.forEach(code => {
    selected[code] = false
  })
  if (stockCodes.length > 0) {
    selected[stockCodes[0]] = true // 让第一个股票代码的折线默认显示
  }

  const series = Object.entries(grouped).map(([name, data]) => {
    const sortedData = data.sort((a, b) => a[0].localeCompare(b[0]))
    const values = sortedData.map(item => item[1])

    // 计算均值
    const average = values.reduce((a, b) => a + b, 0) / values.length

    // 计算中位数
    const median = (() => {
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid]
    })()

    return {
      name,
      type: 'line',
      data: sortedData,
      smooth: true,
      markLine: {
        symbol: 'none',
        lineStyle: {
          type: 'dashed',
          color: 'red'
        },
        label: {
          formatter: (params) => params.name,
          position: 'end'
        },
        data: [
          { name: 'Average', yAxis: average },
          { name: 'Median', yAxis: median }
        ]
      }
    }
  })


  chartInstance.setOption({
    title: {
      text: props.title,
      left: 'center',
      top: 20
    },
    tooltip: { trigger: 'axis' },
    legend: {
      type: 'scroll',
      selected,
      orient: 'vertical',
      right: 10,
      top: 60,
      bottom: 30,
      textStyle: {
        width: 80,
        overflow: 'truncate'
      }
    },
    xAxis: {
      type: 'category',
      name: props.xAxisName,
      axisLabel: {
        rotate: 90  // 🔁 标签旋转角度（单位：度）
      },
      axisLine: {
        show: true,
        symbol: ['none', 'arrow'],
        symbolSize: [10, 15]}
    },
    yAxis: {
      type: 'value',
      name: props.yAxisName ,
      axisLine: {
        show: true, // 显示 Y 轴线
        symbol: ['none', 'arrow'],
        symbolSize: [10, 15],
        lineStyle: {
          type: 'solid', // 实线（默认就是 solid）
          color: '#333', // 可选：轴线颜色
          width: 1       // 可选：轴线宽度
        }
      }
    },
    series
  })
}

const initChart = async () => {
  await nextTick()
  const el = chartRef.value
  if (!el || el.clientWidth === 0 || el.clientHeight === 0) {
    console.warn('[ECharts] 容器尺寸为 0')
    return
  }

  chartInstance = echarts.init(el)
  drawChart()

  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize()
  })
  resizeObserver.observe(el)
}

onMounted(initChart)

onUnmounted(() => {
  if (resizeObserver && chartRef.value) {
    resizeObserver.unobserve(chartRef.value)
    resizeObserver.disconnect()
  }
  chartInstance?.dispose()
})

watch(() => props.chartData, () => {
  drawChart()
}, { immediate: true })
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}
</style>
