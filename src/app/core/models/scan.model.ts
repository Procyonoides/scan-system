export interface ScanReceiving {
  receiving_id?: number;
  warehouse_id: number;
  original_barcode: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  scan_date?: Date;
  username?: string;
}

export interface ScanShipping {
  shipping_id?: number;
  warehouse_id: number;
  original_barcode: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  scan_date?: Date;
  username?: string;
}