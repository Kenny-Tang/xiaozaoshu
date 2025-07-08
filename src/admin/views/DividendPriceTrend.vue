<template>
  <div class="page-container">
    <div class="chart-wrapper">
      <StockTrendChart :chart-data="chartData" title="Stock Price Trend" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as qmt from '@/api/modules/qmt.js'
import StockTrendChart from '../components/StockTrendChart.vue'

const chartData = ref([])

onMounted(async () => {
  try {
    const listDividends = await qmt.listDividends({})
    chartData.value = listDividends
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
