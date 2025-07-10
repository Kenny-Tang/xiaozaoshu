// api/modules/qmt.js
import request from "@/utils/request.js";

export const listDividends = (param) => request.post('/api/qmt/stockDividend/list-trends', param);

export const listStockPrices = (param) => request.post('/api/qmt/stockDailyData/list-trends', param);

