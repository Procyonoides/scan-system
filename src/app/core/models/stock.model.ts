export interface Stock {
  stock_id: number;
  warehouse_id: number;
  brand: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  status: string;
}

export interface WarehouseStats {
  first_stock: number;
  receiving: number;
  shipping: number;
  warehouse_stock: number;
}