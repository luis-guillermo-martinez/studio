export interface Product {
  id: string; // Unique identifier for React keys, can be same as code if codes are unique
  code: string;
  name: string;
  quantity: number;
  lastUpdated: string; // ISO date string
}
