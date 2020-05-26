export type ProductEntity = {
  id: number;
  product_type_id: number;
  name: string;
  price: number;
  description: string | null;
  attribute: any | null;
  currency_code: string;
  created_at: Date;
  updated_at: Date;
};

export type ProductTypeEntity = {
  id: number;
  identifier: string;
};
