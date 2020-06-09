export type OutgoingMessageEntity = {
  id: number;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  failed_attempts: number;
};
