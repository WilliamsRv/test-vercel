/**
 * Tipos de Movimiento
 */
export const MovementType = {
  INITIAL_ASSIGNMENT: 'INITIAL_ASSIGNMENT',
  REASSIGNMENT: 'REASSIGNMENT',
  AREA_TRANSFER: 'AREA_TRANSFER',
  EXTERNAL_TRANSFER: 'EXTERNAL_TRANSFER',
  RETURN: 'RETURN',
  LOAN: 'LOAN',
  MAINTENANCE: 'MAINTENANCE',
  REPAIR: 'REPAIR',
  TEMPORARY_DISPOSAL: 'TEMPORARY_DISPOSAL'
};

/**
 * Estados del Movimiento
 */
export const MovementStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROCESS: 'IN_PROCESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  PARTIAL: 'PARTIAL'
};

/**
 * Labels en español para los tipos de movimiento
 */
export const MovementTypeLabels = {
  [MovementType.INITIAL_ASSIGNMENT]: 'Primera Asignación',
  [MovementType.REASSIGNMENT]: 'Reasignación',
  [MovementType.AREA_TRANSFER]: 'Transferencia entre Áreas',
  [MovementType.EXTERNAL_TRANSFER]: 'Transferencia Externa',
  [MovementType.RETURN]: 'Devolución',
  [MovementType.LOAN]: 'Préstamo Temporal',
  [MovementType.MAINTENANCE]: 'Mantenimiento',
  [MovementType.REPAIR]: 'Reparación',
  [MovementType.TEMPORARY_DISPOSAL]: 'Baja Temporal'
};

/**
 * Labels en español para los estados
 */
export const MovementStatusLabels = {
  [MovementStatus.REQUESTED]: 'Solicitado',
  [MovementStatus.APPROVED]: 'Aprobado',
  [MovementStatus.REJECTED]: 'Rechazado',
  [MovementStatus.IN_PROCESS]: 'En Proceso',
  [MovementStatus.COMPLETED]: 'Completado',
  [MovementStatus.CANCELLED]: 'Cancelado',
  [MovementStatus.PARTIAL]: 'Parcial'
};

/**
 * Configuración de colores para los estados
 */
export const MovementStatusConfig = {
  [MovementStatus.REQUESTED]: {
    label: 'Solicitado',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-500'
  },
  [MovementStatus.APPROVED]: {
    label: 'Aprobado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-500'
  },
  [MovementStatus.REJECTED]: {
    label: 'Rechazado',
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-500'
  },
  [MovementStatus.IN_PROCESS]: {
    label: 'En Proceso',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-500'
  },
  [MovementStatus.COMPLETED]: {
    label: 'Completado',
    color: 'bg-green-50 text-green-700 border-green-200',
    bgColor: 'bg-green-500'
  },
  [MovementStatus.CANCELLED]: {
    label: 'Cancelado',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    bgColor: 'bg-gray-500'
  },
  [MovementStatus.PARTIAL]: {
    label: 'Parcial',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    bgColor: 'bg-purple-500'
  }
};

/**
 * Validar si se puede hacer una transición de estado
 */
export function canTransitionTo(currentStatus, targetStatus) {
  const validTransitions = {
    [MovementStatus.REQUESTED]: [MovementStatus.APPROVED, MovementStatus.REJECTED, MovementStatus.CANCELLED],
    [MovementStatus.APPROVED]: [MovementStatus.IN_PROCESS, MovementStatus.COMPLETED, MovementStatus.CANCELLED],
    [MovementStatus.REJECTED]: [],
    [MovementStatus.IN_PROCESS]: [MovementStatus.COMPLETED, MovementStatus.CANCELLED],
    [MovementStatus.COMPLETED]: [],
    [MovementStatus.CANCELLED]: [],
    [MovementStatus.PARTIAL]: [MovementStatus.COMPLETED, MovementStatus.CANCELLED]
  };
  
  return validTransitions[currentStatus]?.includes(targetStatus) || false;
}

/**
 * Obtener acciones disponibles según el estado
 */
export function getAvailableActions(status) {
  const actions = {
    [MovementStatus.REQUESTED]: ['approve', 'reject', 'cancel', 'edit', 'delete'],
    [MovementStatus.APPROVED]: ['in-process', 'complete', 'cancel', 'edit'],
    [MovementStatus.REJECTED]: ['view'],
    [MovementStatus.IN_PROCESS]: ['complete', 'cancel'],
    [MovementStatus.COMPLETED]: ['view'],
    [MovementStatus.CANCELLED]: ['view'],
    [MovementStatus.PARTIAL]: ['complete', 'cancel']
  };
  
  return actions[status] || [];
}

/**
 * Formatear fecha ISO 8601 a formato legible
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatear solo la fecha (sin hora)
 */
export function formatDateOnly(dateString) {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Calcular la duración entre dos fechas
 * @param {string} startDate - Fecha de inicio (ISO string)
 * @param {string} endDate - Fecha de fin (ISO string o null para fecha actual)
 * @returns {Object} - Objeto con días, meses, años y descripción legible
 */
export function calculateDuration(startDate, endDate = null) {
  if (!startDate) return { days: 0, months: 0, years: 0, description: 'N/A' };
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { days: 0, months: 0, years: 0, description: 'N/A' };
  }
  
  // Calcular diferencia en milisegundos
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Calcular años, meses y días
  let years = 0;
  let months = 0;
  let days = diffDays;
  
  if (days >= 365) {
    years = Math.floor(days / 365);
    days = days % 365;
  }
  
  if (days >= 30) {
    months = Math.floor(days / 30);
    days = days % 30;
  }
  
  // Crear descripción legible
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  
  const description = parts.join(', ');
  
  return { days: diffDays, months, years, description };
}

/**
 * Obtener la fecha de inicio de un período de movimiento
 * @param {Object} movement - Objeto de movimiento
 * @returns {string|null} - Fecha de inicio (receptionDate, executionDate o requestDate)
 */
export function getMovementStartDate(movement) {
  return movement.receptionDate || movement.executionDate || movement.approvalDate || movement.requestDate || null;
}

/**
 * Obtener la fecha de fin de un período de movimiento
 * @param {Object} movement - Objeto de movimiento actual
 * @param {Object} nextMovement - Siguiente movimiento (más reciente) que ocurre después (opcional)
 * @returns {string|null} - Fecha de fin (requestDate del siguiente movimiento o null si es el último)
 */
export function getMovementEndDate(movement, nextMovement = null) {
  if (nextMovement) {
    // Si hay un siguiente movimiento (más reciente), la fecha de fin es cuando se solicitó ese siguiente movimiento
    // Esto marca el fin del período del movimiento actual
    return nextMovement.requestDate || nextMovement.executionDate || null;
  }
  // Si es el último movimiento (más antiguo) y está completado, no hay fecha de fin (aún está en ese lugar)
  if (movement.movementStatus === 'COMPLETED') {
    return null; // Indica que aún está en ese lugar
  }
  // Si el movimiento no está completado, no tiene fecha de fin aún
  return null;
}

