export interface Stock {
  no: number;
  model: string;
  color: string;
  size: string;
  brand: string;
  item: string;
  production: string;
  stock_akhir: number; // Total stock
  percentage: number;
  status: string; // AVAILABLE, LOW_STOCK, OUT_OF_STOCK
  status_production: string; // RUN or STOP
}

export interface WarehouseStats {
  first_stock: number;
  receiving: number;
  shipping: number;
  warehouse_stock: number;
}