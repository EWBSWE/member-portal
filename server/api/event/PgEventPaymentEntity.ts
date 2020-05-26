export type PgEventPaymentEntity = {
  event_id: number;
  payment_id: number;
  name: string;
  email: string;
  amount: number;
  message: string | null;
  addons: number[];
};
