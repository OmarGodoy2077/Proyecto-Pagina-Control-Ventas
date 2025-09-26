import { Product } from './Product';
import { Customer } from './Customer';
import { SafeUser } from './User';

/**
 * Tipo de imagen de venta
 */
export type SaleImageType = 'sealed' | 'full_product' | 'serial_number';

/**
 * Modelo de Imagen de Venta
 */
export interface SaleImage {
  id: string;
  sale_id: string;
  image_type: SaleImageType;
  image_url: string;
  uploaded_at: Date;
}

/**
 * Modelo de Venta
 */
export interface Sale {
  id: string;
  product_id: string;
  customer_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: Date;
  warranty_period_months: number;
  warranty_start: Date;
  warranty_end: Date;
  serial_number: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Venta con información completa (joins)
 */
export interface SaleWithDetails extends Sale {
  product: Product;
  customer: Customer;
  seller: SafeUser;
  images: SaleImage[];
}

/**
 * Datos para crear una nueva venta
 */
export interface CreateSaleData {
  product_id: string;
  customer_id: string;
  quantity: number;
  unit_price: number;
  warranty_period_months: number;
  serial_number?: string;
}

/**
 * Datos para actualizar una venta
 */
export interface UpdateSaleData {
  quantity?: number;
  unit_price?: number;
  warranty_period_months?: number;
  serial_number?: string;
}

/**
 * Filtros para búsqueda de ventas
 */
export interface SaleFilters {
  product_id?: string;
  customer_id?: string;
  seller_id?: string;
  start_date?: Date;
  end_date?: Date;
  min_total?: number;
  max_total?: number;
}

/**
 * Datos de subida de imagen
 */
export interface UploadImageData {
  image_type: SaleImageType;
  file_buffer: Buffer;
  file_name: string;
  mime_type: string;
}

/**
 * Respuesta de extracción de número de serie
 */
export interface SerialExtractionResponse {
  extractedSerial: string;
  imageUrl: string;
  confidence?: number;
}

/**
 * Estadísticas de ventas
 */
export interface SalesStats {
  total_sales: number;
  total_revenue: number;
  average_sale_value: number;
  products_sold: number;
  period_start: Date;
  period_end: Date;
}

/**
 * Garantía próxima a vencer
 */
export interface ExpiringWarranty {
  sale_id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  warranty_end: Date;
  days_until_expiry: number;
}