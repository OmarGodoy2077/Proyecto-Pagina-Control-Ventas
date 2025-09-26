import { Request, Response } from 'express';
import { query } from '../database/connection';
import { generateUUID } from '../utils/helpers';
import { Customer, CreateCustomerData, UpdateCustomerData, CustomerFilters, PaginatedResponse } from '../models';
import { NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler';

/**
 * Controlador de clientes
 * Maneja CRUD de clientes y operaciones relacionadas
 */

/**
 * @route GET /api/customers
 * @desc Obtiene lista paginada de clientes con filtros opcionales
 * @access Private
 */
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Filtros opcionales
    const filters: CustomerFilters = {
      name: req.query.name as string,
      email: req.query.email as string,
      phone: req.query.phone as string
    };

    // Construir cláusula WHERE
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (filters.name) {
      whereClauses.push(`(first_name ILIKE $${paramCounter} OR last_name ILIKE $${paramCounter})`);
      queryParams.push(`%${filters.name}%`);
      paramCounter++;
    }

    if (filters.email) {
      whereClauses.push(`email ILIKE $${paramCounter}`);
      queryParams.push(`%${filters.email}%`);
      paramCounter++;
    }

    if (filters.phone) {
      whereClauses.push(`phone ILIKE $${paramCounter}`);
      queryParams.push(`%${filters.phone}%`);
      paramCounter++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query de conteo
    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Calcular offset y páginas
    const offset = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Query de clientes
    const customersQuery = `
      SELECT 
        id, first_name, last_name, email, phone, address, created_at, updated_at,
        CONCAT(first_name, ' ', last_name) as full_name
      FROM customers
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);
    const customersResult = await query(customersQuery, queryParams);

    const response: PaginatedResponse<Customer> = {
      data: customersResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };

    res.json({
      success: true,
      ...response
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/customers/:id
 * @desc Obtiene un cliente por su ID
 * @access Private
 */
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customerQuery = `
      SELECT 
        id, first_name, last_name, email, phone, address, created_at, updated_at,
        CONCAT(first_name, ' ', last_name) as full_name
      FROM customers
      WHERE id = $1
    `;

    const result = await query(customerQuery, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Cliente no encontrado');
    }

    const customer: Customer = result.rows[0];

    res.json({
      success: true,
      data: { customer }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/customers
 * @desc Crea un nuevo cliente
 * @access Private
 */
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, phone, address }: CreateCustomerData = req.body;

    // Verificar que el email no exista
    const existingCustomer = await query('SELECT id FROM customers WHERE email = $1', [email]);
    if (existingCustomer.rows.length > 0) {
      throw new ConflictError('Ya existe un cliente con este email');
    }

    // Crear cliente
    const customerId = generateUUID();
    const insertQuery = `
      INSERT INTO customers (id, first_name, last_name, email, phone, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone, address, created_at, updated_at
    `;

    const result = await query(insertQuery, [
      customerId,
      first_name,
      last_name,
      email,
      phone || null,
      address || null
    ]);

    const customer: Customer = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: { customer }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route PUT /api/customers/:id
 * @desc Actualiza un cliente existente
 * @access Private
 */
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateCustomerData = req.body;

    // Verificar que el cliente existe
    const existingCustomer = await query('SELECT id FROM customers WHERE id = $1', [id]);
    if (existingCustomer.rows.length === 0) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Si se actualiza el email, verificar que no exista en otro cliente
    if (updateData.email) {
      const emailCheck = await query('SELECT id FROM customers WHERE email = $1 AND id != $2', [updateData.email, id]);
      if (emailCheck.rows.length > 0) {
        throw new ConflictError('Ya existe otro cliente con este email');
      }
    }

    // Construir query de actualización
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (updateData.first_name !== undefined) {
      updateFields.push(`first_name = $${paramCounter}`);
      queryParams.push(updateData.first_name);
      paramCounter++;
    }

    if (updateData.last_name !== undefined) {
      updateFields.push(`last_name = $${paramCounter}`);
      queryParams.push(updateData.last_name);
      paramCounter++;
    }

    if (updateData.email !== undefined) {
      updateFields.push(`email = $${paramCounter}`);
      queryParams.push(updateData.email);
      paramCounter++;
    }

    if (updateData.phone !== undefined) {
      updateFields.push(`phone = $${paramCounter}`);
      queryParams.push(updateData.phone);
      paramCounter++;
    }

    if (updateData.address !== undefined) {
      updateFields.push(`address = $${paramCounter}`);
      queryParams.push(updateData.address);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      throw new ValidationError('No se proporcionaron campos para actualizar');
    }

    // Actualizar cliente
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    queryParams.push(id);

    const updateQuery = `
      UPDATE customers
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING id, first_name, last_name, email, phone, address, created_at, updated_at
    `;

    const result = await query(updateQuery, queryParams);
    const customer: Customer = result.rows[0];

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: { customer }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route DELETE /api/customers/:id
 * @desc Elimina un cliente (solo si no tiene ventas)
 * @access Private
 */
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que el cliente existe
    const existingCustomer = await query('SELECT first_name, last_name FROM customers WHERE id = $1', [id]);
    if (existingCustomer.rows.length === 0) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Verificar que no tenga ventas asociadas
    const salesCheck = await query('SELECT COUNT(*) FROM sales WHERE customer_id = $1', [id]);
    const salesCount = parseInt(salesCheck.rows[0].count, 10);

    if (salesCount > 0) {
      throw new ConflictError(`No se puede eliminar el cliente. Tiene ${salesCount} venta(s) asociada(s)`);
    }

    // Eliminar cliente
    await query('DELETE FROM customers WHERE id = $1', [id]);

    const customerName = `${existingCustomer.rows[0].first_name} ${existingCustomer.rows[0].last_name}`;

    res.json({
      success: true,
      message: `Cliente ${customerName} eliminado exitosamente`
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/customers/:id/sales
 * @desc Obtiene el historial de ventas de un cliente
 * @access Private
 */
export const getCustomerSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Verificar que el cliente existe
    const customerCheck = await query('SELECT first_name, last_name FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Obtener ventas del cliente
    const offset = (page - 1) * limit;

    const salesQuery = `
      SELECT 
        s.id, s.quantity, s.unit_price, s.total_price, s.sale_date,
        s.warranty_period_months, s.warranty_start, s.warranty_end, s.serial_number,
        p.name as product_name, p.sku as product_sku,
        u.first_name as seller_first_name, u.last_name as seller_last_name
      FROM sales s
      INNER JOIN products p ON s.product_id = p.id
      INNER JOIN users u ON s.seller_id = u.id
      WHERE s.customer_id = $1
      ORDER BY s.sale_date DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `SELECT COUNT(*) FROM sales WHERE customer_id = $1`;

    const [salesResult, countResult] = await Promise.all([
      query(salesQuery, [id, limit, offset]),
      query(countQuery, [id])
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const pages = Math.ceil(total / limit);

    const customerName = `${customerCheck.rows[0].first_name} ${customerCheck.rows[0].last_name}`;

    const response: PaginatedResponse<any> = {
      data: salesResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };

    res.json({
      success: true,
      message: `Historial de ventas de ${customerName}`,
      ...response
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/customers/:id/statistics
 * @desc Obtiene estadísticas de compras de un cliente
 * @access Private
 */
export const getCustomerStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que el cliente existe
    const customerCheck = await query('SELECT first_name, last_name FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      throw new NotFoundError('Cliente no encontrado');
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_purchases,
        SUM(total_price) as total_spent,
        AVG(total_price) as average_purchase,
        MIN(sale_date) as first_purchase_date,
        MAX(sale_date) as last_purchase_date,
        COUNT(DISTINCT product_id) as unique_products_purchased
      FROM sales
      WHERE customer_id = $1
    `;

    const result = await query(statsQuery, [id]);
    const stats = result.rows[0];

    const customerName = `${customerCheck.rows[0].first_name} ${customerCheck.rows[0].last_name}`;

    res.json({
      success: true,
      data: {
        customer_name: customerName,
        statistics: {
          total_purchases: parseInt(stats.total_purchases, 10) || 0,
          total_spent: parseFloat(stats.total_spent) || 0,
          average_purchase: parseFloat(stats.average_purchase) || 0,
          first_purchase_date: stats.first_purchase_date,
          last_purchase_date: stats.last_purchase_date,
          unique_products_purchased: parseInt(stats.unique_products_purchased, 10) || 0
        }
      }
    });
  } catch (error) {
    throw error;
  }
};