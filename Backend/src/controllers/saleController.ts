import { Request, Response } from 'express';
import multer from 'multer';
import { query, getClient } from '../database/connection';
import { generateUUID } from '../utils/helpers';
import { calculateWarrantyDates } from '../services/warrantyService';
import { uploadImage } from '../services/imageService';
import { extractSerialFromImage } from '../services/ocrService';
import { 
  Sale, 
  CreateSaleData, 
  UpdateSaleData, 
  SaleFilters, 
  SaleWithDetails, 
  SaleImageType,
  PaginatedResponse 
} from '../models';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler';

/**
 * Configuración de multer para subida de imágenes
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP)'));
    }
  }
});

/**
 * Middleware de multer para múltiples imágenes
 */
export const uploadImages = upload.array('images', 3);

/**
 * Middleware de multer para imagen individual
 */
export const uploadSingleImage = upload.single('image');

/**
 * Controlador de ventas
 * Maneja CRUD de ventas, imágenes y operaciones relacionadas
 */

/**
 * @route GET /api/sales
 * @desc Obtiene lista paginada de ventas con filtros opcionales
 * @access Private
 */
export const getSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'sale_date';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Filtros opcionales
    const filters: SaleFilters = {
      product_id: req.query.product_id as string,
      customer_id: req.query.customer_id as string,
      seller_id: req.query.seller_id as string,
      start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
      end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      min_total: req.query.min_total ? parseFloat(req.query.min_total as string) : undefined,
      max_total: req.query.max_total ? parseFloat(req.query.max_total as string) : undefined
    };

    // Construir cláusula WHERE
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (filters.product_id) {
      whereClauses.push(`s.product_id = $${paramCounter}`);
      queryParams.push(filters.product_id);
      paramCounter++;
    }

    if (filters.customer_id) {
      whereClauses.push(`s.customer_id = $${paramCounter}`);
      queryParams.push(filters.customer_id);
      paramCounter++;
    }

    if (filters.seller_id) {
      whereClauses.push(`s.seller_id = $${paramCounter}`);
      queryParams.push(filters.seller_id);
      paramCounter++;
    }

    if (filters.start_date) {
      whereClauses.push(`s.sale_date >= $${paramCounter}`);
      queryParams.push(filters.start_date);
      paramCounter++;
    }

    if (filters.end_date) {
      whereClauses.push(`s.sale_date <= $${paramCounter}`);
      queryParams.push(filters.end_date);
      paramCounter++;
    }

    if (filters.min_total) {
      whereClauses.push(`s.total_price >= $${paramCounter}`);
      queryParams.push(filters.min_total);
      paramCounter++;
    }

    if (filters.max_total) {
      whereClauses.push(`s.total_price <= $${paramCounter}`);
      queryParams.push(filters.max_total);
      paramCounter++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query de conteo
    const countQuery = `SELECT COUNT(*) FROM sales s ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Calcular offset y páginas
    const offset = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Query de ventas con joins
    const salesQuery = `
      SELECT 
        s.id, s.quantity, s.unit_price, s.total_price, s.sale_date,
        s.warranty_period_months, s.warranty_start, s.warranty_end, s.serial_number,
        s.created_at, s.updated_at,
        p.id as product_id, p.name as product_name, p.sku as product_sku,
        c.id as customer_id, c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email,
        u.id as seller_id, u.first_name as seller_first_name, u.last_name as seller_last_name, u.email as seller_email
      FROM sales s
      INNER JOIN products p ON s.product_id = p.id
      INNER JOIN customers c ON s.customer_id = c.id
      INNER JOIN users u ON s.seller_id = u.id
      ${whereClause}
      ORDER BY s.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);
    const salesResult = await query(salesQuery, queryParams);

    // Formatear resultados
    const formattedSales = salesResult.rows.map((row: any) => ({
      id: row.id,
      quantity: row.quantity,
      unit_price: parseFloat(row.unit_price),
      total_price: parseFloat(row.total_price),
      sale_date: row.sale_date,
      warranty_period_months: row.warranty_period_months,
      warranty_start: row.warranty_start,
      warranty_end: row.warranty_end,
      serial_number: row.serial_number,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku
      },
      customer: {
        id: row.customer_id,
        first_name: row.customer_first_name,
        last_name: row.customer_last_name,
        email: row.customer_email
      },
      seller: {
        id: row.seller_id,
        first_name: row.seller_first_name,
        last_name: row.seller_last_name,
        email: row.seller_email
      }
    }));

    const response: PaginatedResponse<any> = {
      data: formattedSales,
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
 * @route GET /api/sales/:id
 * @desc Obtiene una venta por su ID con detalles completos
 * @access Private
 */
export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Query principal de la venta con joins
    const saleQuery = `
      SELECT 
        s.*,
        p.id as product_id, p.name as product_name, p.description as product_description, 
        p.sku as product_sku, p.price as product_price,
        c.id as customer_id, c.first_name as customer_first_name, c.last_name as customer_last_name, 
        c.email as customer_email, c.phone as customer_phone, c.address as customer_address,
        u.id as seller_id, u.first_name as seller_first_name, u.last_name as seller_last_name, 
        u.email as seller_email, u.role as seller_role
      FROM sales s
      INNER JOIN products p ON s.product_id = p.id
      INNER JOIN customers c ON s.customer_id = c.id
      INNER JOIN users u ON s.seller_id = u.id
      WHERE s.id = $1
    `;

    const saleResult = await query(saleQuery, [id]);

    if (saleResult.rows.length === 0) {
      throw new NotFoundError('Venta no encontrada');
    }

    // Query de imágenes asociadas
    const imagesQuery = `
      SELECT id, image_type, image_url, uploaded_at
      FROM sale_images
      WHERE sale_id = $1
      ORDER BY uploaded_at ASC
    `;

    const imagesResult = await query(imagesQuery, [id]);

    const row = saleResult.rows[0];

    const saleWithDetails: SaleWithDetails = {
      id: row.id,
      product_id: row.product_id,
      customer_id: row.customer_id,
      seller_id: row.seller_id,
      quantity: row.quantity,
      unit_price: parseFloat(row.unit_price),
      total_price: parseFloat(row.total_price),
      sale_date: row.sale_date,
      warranty_period_months: row.warranty_period_months,
      warranty_start: row.warranty_start,
      warranty_end: row.warranty_end,
      serial_number: row.serial_number,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        sku: row.product_sku,
        price: parseFloat(row.product_price),
        stock: 0, // No necesario en este contexto
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      customer: {
        id: row.customer_id,
        first_name: row.customer_first_name,
        last_name: row.customer_last_name,
        email: row.customer_email,
        phone: row.customer_phone,
        address: row.customer_address,
        created_at: new Date(),
        updated_at: new Date()
      },
      seller: {
        id: row.seller_id,
        email: row.seller_email,
        first_name: row.seller_first_name,
        last_name: row.seller_last_name,
        role: row.seller_role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      images: imagesResult.rows
    };

    res.json({
      success: true,
      data: { sale: saleWithDetails }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/sales
 * @desc Crea una nueva venta
 * @access Private
 */
export const createSale = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { product_id, customer_id, quantity, unit_price, warranty_period_months, serial_number }: CreateSaleData = req.body;
    const seller_id = (req as any).user?.userId;

    if (!seller_id) {
      throw new ValidationError('Vendedor no identificado');
    }

    // Verificar que el producto existe y tiene stock suficiente
    const productQuery = 'SELECT name, stock, price FROM products WHERE id = $1 AND is_active = true';
    const productResult = await client.query(productQuery, [product_id]);

    if (productResult.rows.length === 0) {
      throw new NotFoundError('Producto no encontrado o inactivo');
    }

    const product = productResult.rows[0];

    if (product.stock < quantity) {
      throw new ValidationError(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`);
    }

    // Verificar que el cliente existe
    const customerCheck = await client.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
    if (customerCheck.rows.length === 0) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Calcular precio total
    const total_price = quantity * unit_price;

    // Calcular fechas de garantía
    const sale_date = new Date();
    const { warrantyStart, warrantyEnd } = calculateWarrantyDates(sale_date, warranty_period_months);

    // Crear venta
    const saleId = generateUUID();
    const insertSaleQuery = `
      INSERT INTO sales (
        id, product_id, customer_id, seller_id, quantity, unit_price, total_price,
        sale_date, warranty_period_months, warranty_start, warranty_end, serial_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const saleResult = await client.query(insertSaleQuery, [
      saleId, product_id, customer_id, seller_id, quantity, unit_price, total_price,
      sale_date, warranty_period_months, warrantyStart, warrantyEnd, serial_number || null
    ]);

    // Actualizar stock del producto
    const updateStockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2';
    await client.query(updateStockQuery, [quantity, product_id]);

    await client.query('COMMIT');

    const sale: Sale = saleResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: { 
        sale: {
          ...sale,
          unit_price: parseFloat(sale.unit_price),
          total_price: parseFloat(sale.total_price)
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * @route POST /api/sales/:id/images
 * @desc Sube imágenes para una venta
 * @access Private
 */
export const uploadSaleImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: saleId } = req.params;
    const files = req.files as Express.Multer.File[];
    const { image_types } = req.body;

    if (!files || files.length === 0) {
      throw new ValidationError('No se proporcionaron imágenes');
    }

    if (!image_types || !Array.isArray(image_types)) {
      throw new ValidationError('Tipos de imagen requeridos como array');
    }

    if (files.length !== image_types.length) {
      throw new ValidationError('Número de imágenes debe coincidir con tipos de imagen');
    }

    // Verificar que la venta existe
    const saleCheck = await query('SELECT id FROM sales WHERE id = $1', [saleId]);
    if (saleCheck.rows.length === 0) {
      throw new NotFoundError('Venta no encontrada');
    }

    // Procesar cada imagen
    const uploadPromises = files.map(async (file, index) => {
      const imageType = image_types[index] as SaleImageType;
      
      // Validar tipo de imagen
      if (!['sealed', 'full_product', 'serial_number'].includes(imageType)) {
        throw new ValidationError(`Tipo de imagen inválido: ${imageType}`);
      }

      // Subir imagen (simulado)
      const uploadResult = await uploadImage(file.buffer, file.originalname, imageType);

      // Guardar en base de datos
      const imageId = generateUUID();
      const insertImageQuery = `
        INSERT INTO sale_images (id, sale_id, image_type, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await query(insertImageQuery, [
        imageId, saleId, imageType, uploadResult.imageUrl
      ]);

      return result.rows[0];
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`,
      data: { images: uploadedImages }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/sales/:id/extract-serial
 * @desc Extrae número de serie de una imagen usando OCR (simulado)
 * @access Private
 */
export const extractSerial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: saleId } = req.params;
    const file = req.file;

    if (!file) {
      throw new ValidationError('Imagen requerida');
    }

    // Verificar que la venta existe
    const saleCheck = await query('SELECT id, serial_number FROM sales WHERE id = $1', [saleId]);
    if (saleCheck.rows.length === 0) {
      throw new NotFoundError('Venta no encontrada');
    }

    // Extraer número de serie usando OCR simulado
    const extractionResult = await extractSerialFromImage(file.buffer, file.originalname);

    // Subir imagen como tipo serial_number
    const uploadResult = await uploadImage(file.buffer, file.originalname, 'serial_number');

    // Guardar imagen en base de datos
    const imageId = generateUUID();
    const insertImageQuery = `
      INSERT INTO sale_images (id, sale_id, image_type, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    await query(insertImageQuery, [
      imageId, saleId, 'serial_number', uploadResult.imageUrl
    ]);

    // Actualizar número de serie en la venta si no existe
    if (!saleCheck.rows[0].serial_number) {
      await query(
        'UPDATE sales SET serial_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [extractionResult.extractedSerial, saleId]
      );
    }

    res.json({
      success: true,
      message: 'Número de serie extraído exitosamente',
      data: extractionResult
    });
  } catch (error) {
    throw error;
  }
};