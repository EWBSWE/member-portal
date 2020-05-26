export type PgEventEntity = {
  id: number;
  name: string;
  description: string;
  identifier: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  due_date: Date;
  email_template_id: number;
  notification_open: boolean;
};
