import type { ComponentType } from 'react';
import type { Role } from './types';

export interface ModuleDefinition {
  id: string;
  label: string;
  path: string;
  icon?: string;
  allowedRoles: Role[];
  element: ComponentType;
  order?: number;
  showInNav?: boolean;
}

const registry: ModuleDefinition[] = [];

export function registerModule(def: ModuleDefinition): void {
  if (registry.some((m) => m.id === def.id)) {
    throw new Error(`Module "${def.id}" is already registered`);
  }
  registry.push(def);
}

export function getAllModules(): ModuleDefinition[] {
  return registry;
}

export function canAccessModule(role: Role | null, module: ModuleDefinition): boolean {
  if (!role) return false;
  return role === 'yonetici' || module.allowedRoles.includes(role);
}

export function getModulesForRole(role: Role | null): ModuleDefinition[] {
  return registry
    .filter((m) => canAccessModule(role, m))
    .filter((m) => m.showInNav !== false)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
