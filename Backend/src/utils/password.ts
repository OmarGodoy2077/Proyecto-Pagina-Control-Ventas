import bcrypt from 'bcryptjs';

/**
 * Configuración para el hashing de contraseñas
 */
const SALT_ROUNDS = 12;

/**
 * Genera un hash de la contraseña
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error al generar hash de contraseña');
  }
};

/**
 * Verifica si una contraseña coincide con su hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado
 * @returns True si la contraseña es correcta
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Error al verificar contraseña');
  }
};

/**
 * Genera una contraseña temporal aleatoria
 * @param length - Longitud de la contraseña (por defecto 12)
 * @returns Contraseña temporal
 */
export const generateTempPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @returns Objeto con el resultado de la validación
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const validatePasswordStrength = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Verificar longitud mínima
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  // Verificar al menos una letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  // Verificar al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  // Verificar al menos un número
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  // Verificar al menos un carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }

  // Determinar fortaleza
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLongEnough = password.length >= 8;

  const criteriasMet = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;

  if (criteriasMet >= 4 && password.length >= 12) {
    strength = 'strong';
  } else if (criteriasMet >= 3 && password.length >= 8) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};