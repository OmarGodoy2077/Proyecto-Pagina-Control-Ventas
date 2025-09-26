/**
 * Modelo de Cliente
 */
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Datos para crear un nuevo cliente
 */
export interface CreateCustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
}

/**
 * Datos para actualizar un cliente
 */
export interface UpdateCustomerData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Filtros para búsqueda de clientes
 */
export interface CustomerFilters {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Cliente con información completa del nombre
 */
export interface CustomerWithFullName extends Customer {
  full_name: string;
}