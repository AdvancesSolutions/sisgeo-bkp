export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  cpf?: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  unitId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  radius?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Area {
  id: string;
  locationId: string;
  name: string;
  riskClassification?: string | null;
  cleaningFrequency?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'LATE' | 'REJECTED';

export interface Task {
  id: string;
  areaId: string;
  employeeId?: string;
  scheduledDate: Date;
  scheduledTime?: string | null;
  status: TaskStatus;
  title?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRecord {
  id: string;
  taskId: string;
  startedAt: Date;
  finishedAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PhotoType = 'BEFORE' | 'AFTER';

export interface Photo {
  id: string;
  serviceRecordId: string;
  type: PhotoType;
  url: string;
  lat?: number;
  lng?: number;
  hash?: string;
  createdAt: Date;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialComment {
  id: string;
  materialId: string;
  userId: string;
  userName?: string;
  body: string;
  createdAt: Date;
}

export type StockMovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  materialId: string;
  type: StockMovementType;
  qty: number;
  ref?: string;
  createdAt: Date;
}

export type TimeClockType = 'CHECKIN' | 'CHECKOUT';

export interface TimeClock {
  id: string;
  employeeId: string;
  type: TimeClockType;
  lat?: number;
  lng?: number;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}
