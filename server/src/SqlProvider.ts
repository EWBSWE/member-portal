import { QueryFile } from "pg-promise";
import * as path from "path";

function inflate(pathToFile: string): QueryFile {
  const src = path.join(__dirname, pathToFile);
  return new QueryFile(src, { minify: true });
}

export type SqlProvider = {
  InsertUser: QueryFile;
  UserById: QueryFile;
  Users: QueryFile;
  DeleteUser: QueryFile;
  InsertOutgoingMessage: QueryFile;
  UserByEmail: QueryFile;
  UserChangePassword: QueryFile;
  UserResetPassword: QueryFile;
  UserByToken: QueryFile;

  Events: QueryFile;
  EventParticipants: QueryFile;
  EventById: QueryFile;
  ActiveEventByIdentifier: QueryFile;
  EventEmailTemplate: QueryFile;
  EventEmailTemplateById: QueryFile;
  EventPaymentsById: QueryFile;
  EventPayments: QueryFile;
  EventSubscribersById: QueryFile;
  EventSubscribers: QueryFile;
  EventParticipantsById: QueryFile;
  EventAddonsById: QueryFile;
  EventAddons: QueryFile;
  EventUpdate: QueryFile;
  EventClearSubscribers: QueryFile;
  EventAddSubscriber: QueryFile;
  EventUpdateEmailTemplate: QueryFile;

  EmailTemplateInsert: QueryFile;
  ProductTypeEvent: QueryFile;
  ProductInsert: QueryFile;
  EventInsert: QueryFile;
  EventProductInsert: QueryFile;
  EventSubscriberInsert: QueryFile;
  EventDelete: QueryFile;
  EventProductDelete: QueryFile;
  EventProductUpdate: QueryFile;
  ProductUpdate: QueryFile;
  EventAddParticipant: QueryFile;
  PaymentById: QueryFile;

  Members: QueryFile;
  MemberById: QueryFile;
  MemberByEmail: QueryFile;
  MemberByEmails: QueryFile;
  MemberInsert: QueryFile;

  Chapters: QueryFile;
};

export const SqlProvider: SqlProvider = {
  InsertUser: inflate("../../sql/InsertUser.sql"),
  UserById: inflate("../../sql/UserById.sql"),
  Users: inflate("../../sql/Users.sql"),
  DeleteUser: inflate("../../sql/DeleteUser.sql"),
  InsertOutgoingMessage: inflate("../../sql/InsertOutgoingMessage.sql"),
  UserByEmail: inflate("../../sql/UserByEmail.sql"),
  UserByToken: inflate("../../sql/UserByToken.sql"),
  UserChangePassword: inflate("../../sql/UserChangePassword.sql"),
  UserResetPassword: inflate("../../sql/UserResetPassword.sql"),

  Events: inflate("../../sql/Events.sql"),
  EventById: inflate("../../sql/EventById.sql"),

  EventParticipants: inflate("../../sql/EventParticipants.sql"),
  EventParticipantsById: inflate("../../sql/EventParticipantsById.sql"),

  ActiveEventByIdentifier: inflate("../../sql/ActiveEventByIdentifier.sql"),

  EventEmailTemplate: inflate("../../sql/EventEmailTemplate.sql"),
  EventEmailTemplateById: inflate("../../sql/EventEmailTemplateById.sql"),

  EventPayments: inflate("../../sql/EventPayments.sql"),
  EventPaymentsById: inflate("../../sql/EventPaymentsById.sql"),

  EventSubscribers: inflate("../../sql/EventSubscribers.sql"),
  EventSubscribersById: inflate("../../sql/EventSubscribersById.sql"),

  EventAddons: inflate("../../sql/EventAddons.sql"),
  EventAddonsById: inflate("../../sql/EventAddonsById.sql"),

  EventUpdate: inflate("../../sql/EventUpdate.sql"),
  EventClearSubscribers: inflate("../../sql/EventClearSubscribers.sql"),
  EventAddSubscriber: inflate("../../sql/EventAddSubscriber.sql"),
  EventUpdateEmailTemplate: inflate("../../sql/EventUpdateEmailTemplate.sql"),

  EmailTemplateInsert: inflate("../../sql/EmailTemplateInsert.sql"),
  ProductTypeEvent: inflate("../../sql/ProductTypeEvent.sql"),
  ProductInsert: inflate("../../sql/ProductInsert.sql"),
  EventInsert: inflate("../../sql/EventInsert.sql"),
  EventProductInsert: inflate("../../sql/EventProductInsert.sql"),
  EventSubscriberInsert: inflate("../../sql/EventSubscriberInsert.sql"),
  EventDelete: inflate("../../sql/EventDelete.sql"),
  EventProductDelete: inflate("../../sql/EventProductDelete.sql"),
  EventProductUpdate: inflate("../../sql/EventProductUpdate.sql"),
  ProductUpdate: inflate("../../sql/ProductUpdate.sql"),
  EventAddParticipant: inflate("../../sql/EventAddParticipant.sql"),
  PaymentById: inflate("../../sql/PaymentById.sql"),

  Members: inflate("../../sql/Members.sql"),
  MemberById: inflate("../../sql/MemberById.sql"),
  MemberByEmail: inflate("../../sql/MemberByEmail.sql"),
  MemberByEmails: inflate("../../sql/MemberByEmails.sql"),
  MemberInsert: inflate("../../sql/MemberInsert.sql"),

  Chapters: inflate("../../sql/Chapters.sql"),
};
