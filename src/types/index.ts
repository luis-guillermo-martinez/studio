
export interface Product {
  id: string; // Unique identifier for React keys, typically same as code
  code: string; // Corresponds to CSV "ID"
  isActive: boolean; // Corresponds to CSV "Activo (0/1)"
  name: string; // Corresponds to CSV "Nombre*", required
  categories?: string; // Corresponds to CSV "Categorías (x,y,z...)"
  priceWithoutVAT?: number; // Corresponds to CSV "Precio sin IVA"
  priceWithVAT?: number; // Corresponds to CSV "Precio con IVA"
  costPrice?: number; // Corresponds to CSV "Precio de coste"
  brand?: string; // Corresponds to CSV "Marca"
  quantity: number; // Corresponds to CSV "Cantidad"
  summary?: string; // Corresponds to CSV "Resumen"
  description?: string; // Corresponds to CSV "Descripción"
  lastUpdated: string; // ISO date string, maintained internally
}
