export type EventEntity = {
  id: number;
  name: string;
  description: string;
  identifier: string;
  active: boolean;
  dueDate: Date;
  notificationOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
  emailTemplateId: number;
};
