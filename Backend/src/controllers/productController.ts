import { Request, Response } from 'express';
import { query } from '../database/connection';
import { generateUUID, generateSKU } from '../utils/helpers';
import { Product, CreateProductData, UpdateProductData, ProductFilters, PaginatedResponse } from '../models';
import { NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler';

/**
 * Controlador de productos
 * Maneja CRUD de productos y operaciones relacionadas
 */

/**
 * @route GET /api/products
 * @desc Obtiene lista paginada de productos con filtros opcionales
 * @access Private
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Filtros opcionales
    const filters: ProductFilters = {
      name: req.query.name as string,
      sku: req.query.sku as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
      min_stock: req.query.min_stock ? parseInt(req.query.min_stock as string) : undefined,
      max_stock: req.query.max_stock ? parseInt(req.query.max_stock as string) : undefined
    };

    // Construir cláusula WHERE
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (filters.name) {
      whereClauses.push(`name ILIKE $${paramCounter}`);
      queryParams.push(`%${filters.name}%`);
      paramCounter++;
    }

    if (filters.sku) {
      whereClauses.push(`sku ILIKE $${paramCounter}`);
      queryParams.push(`%${filters.sku}%`);
      paramCounter++;
    }

    if (filters.is_active !== undefined) {
      whereClauses.push(`is_active = $${paramCounter}`);
      queryParams.push(filters.is_active);
      paramCounter++;
    }

    if (filters.min_price !== undefined) {
      whereClauses.push(`price >= $${paramCounter}`);
      queryParams.push(filters.min_price);
      paramCounter++;
    }

    if (filters.max_price !== undefined) {
      whereClauses.push(`price <= $${paramCounter}`);
      queryParams.push(filters.max_price);
      paramCounter++;
    }

    if (filters.min_stock !== undefined) {
      whereClauses.push(`stock >= $${paramCounter}`);
      queryParams.push(filters.min_stock);
      paramCounter++;
    }

    if (filters.max_stock !== undefined) {
      whereClauses.push(`stock <= $${paramCounter}`);
      queryParams.push(filters.max_stock);
      paramCounter++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query de conteo
    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Calcular offset y páginas
    const offset = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Query de productos
    const productsQuery = `
      SELECT id, name, description, sku, stock, price, is_active, created_at, updated_at
      FROM products
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);
    const productsResult = await query(productsQuery, queryParams);

    const response: PaginatedResponse<Product> = {
      data: productsResult.rows,
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
 * @route GET /api/products/:id
 * @desc Obtiene un producto por su ID
 * @access Private
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const productQuery = `
      SELECT id, name, description, sku, stock, price, is_active, created_at, updated_at
      FROM products
      WHERE id = $1
    `;

    const result = await query(productQuery, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Producto no encontrado');
    }

    const product: Product = result.rows[0];

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/products
 * @desc Crea un nuevo producto
 * @access Private
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, sku, stock = 0, price }: CreateProductData = req.body;

    // Verificar que el SKU no exista
    const existingProduct = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existingProduct.rows.length > 0) {
      throw new ConflictError('Ya existe un producto con este SKU');
    }

    // Crear producto
    const productId = generateUUID();
    const insertQuery = `
      INSERT INTO products (id, name, description, sku, stock, price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, sku, stock, price, is_active, created_at, updated_at
    `;

    const result = await query(insertQuery, [
      productId,
      name,
      description || null,
      sku,
      stock,
      price
    ]);

    const product: Product = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { product }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route PUT /api/products/:id
 * @desc Actualiza un producto existente
 * @access Private
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateProductData = req.body;

    // Verificar que el producto existe
    const existingProduct = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      throw new NotFoundError('Producto no encontrado');
    }

    // Si se actualiza el SKU, verificar que no exista en otro producto
    if (updateData.sku) {
      const skuCheck = await query('SELECT id FROM products WHERE sku = $1 AND id != $2', [updateData.sku, id]);
      if (skuCheck.rows.length > 0) {
        throw new ConflictError('Ya existe otro producto con este SKU');
      }
    }

    // Construir query de actualización
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramCounter}`);
      queryParams.push(updateData.name);
      paramCounter++;
    }

    if (updateData.description !== undefined) {
      updateFields.push(`description = $${paramCounter}`);
      queryParams.push(updateData.description);
      paramCounter++;
    }

    if (updateData.sku !== undefined) {
      updateFields.push(`sku = $${paramCounter}`);
      queryParams.push(updateData.sku);
      paramCounter++;
    }

    if (updateData.stock !== undefined) {
      updateFields.push(`stock = $${paramCounter}`);
      queryParams.push(updateData.stock);
      paramCounter++;
    }

    if (updateData.price !== undefined) {
      updateFields.push(`price = $${paramCounter}`);
      queryParams.push(updateData.price);
      paramCounter++;
    }

    if (updateData.is_active !== undefined) {
      updateFields.push(`is_active = $${paramCounter}`);
      queryParams.push(updateData.is_active);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      throw new ValidationError('No se proporcionaron campos para actualizar');
    }

    // Actualizar producto
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    queryParams.push(id);

    const updateQuery = `
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING id, name, description, sku, stock, price, is_active, created_at, updated_at
    `;

    const result = await query(updateQuery, queryParams);
    const product: Product = result.rows[0];

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { product }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route DELETE /api/products/:id
 * @desc Elimina (desactiva) un producto
 * @access Private
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const existingProduct = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      throw new NotFoundError('Producto no encontrado');
    }

    // Marcar como inactivo en lugar de eliminar (soft delete)
    const updateQuery = `
      UPDATE products
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, sku
    `;

    const result = await query(updateQuery, [id]);
    const product = result.rows[0];

    res.json({
      success: true,
      message: `Producto ${product.name} (${product.sku}) desactivado exitosamente`
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/products/low-stock
 * @desc Obtiene productos con stock bajo (menos de 10 unidades)
 * @access Private
 */
export const getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;

    const lowStockQuery = `
      SELECT 
        id, name, description, sku, stock, price, is_active, created_at, updated_at,
        CASE 
          WHEN stock = 0 THEN 'out_of_stock'
          ELSE 'low'
        END as stock_status
      FROM products
      WHERE stock <= $1 AND is_active = true
      ORDER BY stock ASC, name
    `;

    const result = await query(lowStockQuery, [threshold]);

    res.json({
      success: true,
      data: {
        products: result.rows,
        threshold,
        count: result.rows.length
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/products/:id/adjust-stock
 * @desc Ajusta el stock de un producto
 * @access Private
 */
export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    if (typeof adjustment !== 'number') {
      throw new ValidationError('El ajuste debe ser un número');
    }

    // Obtener stock actual
    const currentStockQuery = 'SELECT stock, name FROM products WHERE id = $1 AND is_active = true';
    const currentStockResult = await query(currentStockQuery, [id]);

    if (currentStockResult.rows.length === 0) {
      throw new NotFoundError('Producto no encontrado o inactivo');
    }

    const currentStock = currentStockResult.rows[0].stock;
    const productName = currentStockResult.rows[0].name;
    const newStock = currentStock + adjustment;

    if (newStock < 0) {
      throw new ValidationError('El stock no puede ser negativo');
    }

    // Actualizar stock
    const updateQuery = `
      UPDATE products
      SET stock = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING stock
    `;

    const result = await query(updateQuery, [newStock, id]);

    res.json({
      success: true,
      message: `Stock de ${productName} ajustado exitosamente`,
      data: {
        previousStock: currentStock,
        adjustment,
        newStock: result.rows[0].stock,
        reason: reason || 'Sin razón especificada'
      }
    });
  } catch (error) {
    throw error;
  }
};