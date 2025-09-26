/**
 * Modelo de Producto
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  stock: number;
  price: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Datos para crear un nuevo producto
 */
export interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  stock?: number;
  price: number;
}

/**
 * Datos para actualizar un producto
 */
export interface UpdateProductData {
  name?: string;
  description?: string;
  sku?: string;
  stock?: number;
  price?: number;
  is_active?: boolean;
}

/**
 * Filtros para búsqueda de productos
 */
export interface ProductFilters {
  name?: string;
  sku?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  min_stock?: number;
  max_stock?: number;
}

/**
 * Producto con información de stock bajo
 */
export interface LowStockProduct extends Product {
  stock_status: 'low' | 'out_of_stock';
}