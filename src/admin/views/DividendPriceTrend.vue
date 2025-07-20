<template>
  <div class="page-container">
    <div class="button-bar">
      <el-button type="primary" @click="showDividendChart = !showDividendChart">
        Show Dividend Chart
      </el-button>
      <el-button type="primary" @click="showPriceChart = !showPriceChart">
        Show Price Chart
      </el-button>
    </div>

    <div class="chart-wrapper" v-show="showDividendChart" >
      <StockTrendChart v-bind="dividendChartRef" />
    </div>
    <div class="chart-wrapper" v-show="showPriceChart" >
      <StockTrendChart v-bind="priceChartRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import * as qmt from '@/api/modules/qmt.js'
import StockTrendChart from '../components/StockTrendChart.vue'

const showDividendChart = ref(true)
const showPriceChart = ref(true)

const priceChartRef = ref({
  chartData: [],
  title: 'Stock Price Trend',
  yAxisName: 'StockPrice',
  yAxisMin: 20,
})
const dividendChartRef = ref({
  chartData: [],
  title: 'Stock Dividend Trend',
  xAxisName: 'Year',
  yAxisName: 'DividendYield',
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
.button-bar {
  display: flex;
  justify-content: right; /* 水平居中 */
  gap: 12px;                /* 按钮之间留点间距 */
  margin-bottom: 16px;      /* 与下方图表拉开距离 */
}

.chart-wrapper {
  flex: 1;
  min-height: 0;
}
</style>
