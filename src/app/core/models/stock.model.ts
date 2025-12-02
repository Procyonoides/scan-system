export interface Stock {
  no: number;
  model: string;
  color: string;
  size: string;
  brand: string;
  item: string;
  production: string;
  stock_awal: number;
  receiving: number;
  shipping: number;
  stock_akhir: number;
  percentage: number;
  status: string;
  date: string;
}

export interface WarehouseStats {
  first_stock: number;
  receiving: number;
  shipping: number;
  warehouse_stock: number;
}