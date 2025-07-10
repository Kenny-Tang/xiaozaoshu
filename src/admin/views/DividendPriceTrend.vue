<template>
  <div class="page-container">
    <div class="chart-wrapper">
      <StockTrendChart v-bind="dividendChartRef" />
    </div>
    <div class="chart-wrapper">
      <StockTrendChart v-bind="priceChartRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as qmt from '@/api/modules/qmt.js'
import StockTrendChart from '../components/StockTrendChart.vue'

const priceData = ref([])
const priceChartRef = ref({
  chartData: [],
  title: 'Stock Price Trend',
  yAxisName: 'StockPrice'
})
const dividendChartRef = ref({
  chartData: [],
  title: 'Stock Dividend Trend',
  xAxisName: 'Year',
  yAxisName: 'DividendYield'
})

onMounted(async () => {
  try {
    const listDividends = await qmt.listDividends({})

    const listStockPriceTrend = await qmt.listStockPrices({})
    dividendChartRef.value.chartData = listDividends;
    priceChartRef.value.chartData = listStockPriceTrend
  } catch (err) {
    console.error('Error loading stock trend data:', err)
  }
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}
.chart-wrapper {
  flex: 1;
  min-height: 0;
}
</style>
