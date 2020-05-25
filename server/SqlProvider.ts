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
  EventPaymentsById: QueryFile;
  EventSubscribersById: QueryFile;
  EventParticipantsById: QueryFile;
  EventAddonsById: QueryFile;
  EventUpdate: QueryFile;
  EventClearSubscribers: QueryFile;
  EventAddSubscriber: QueryFile;
  EventUpdateEmailTemplate: QueryFile;
};

export const SqlProvider: SqlProvider = {
  InsertUser: inflate("../sql/InsertUser.sql"),
  UserById: inflate("../sql/UserById.sql"),
  Users: inflate("../sql/Users.sql"),
  DeleteUser: inflate("../sql/DeleteUser.sql"),
  InsertOutgoingMessage: inflate("../sql/InsertOutgoingMessage.sql"),
  UserByEmail: inflate("../sql/UserByEmail.sql"),
  UserByToken: inflate("../sql/UserByToken.sql"),
  UserChangePassword: inflate("../sql/UserChangePassword.sql"),
  UserResetPassword: inflate("../sql/UserResetPassword.sql"),

  Events: inflate("../sql/Events.sql"),
  EventParticipants: inflate("../sql/EventParticipants.sql"),
  EventById: inflate("../sql/EventById.sql"),
  ActiveEventByIdentifier: inflate("../sql/ActiveEventByIdentifier.sql"),
  EventEmailTemplate: inflate("../sql/EventEmailTemplate.sql"),
  EventPaymentsById: inflate("../sql/EventPaymentsById.sql"),
  EventSubscribersById: inflate("../sql/EventSubscribersById.sql"),
  EventParticipantsById: inflate("../sql/EventParticipantsById.sql"),
  EventAddonsById: inflate("../sql/EventAddonsById.sql"),
  EventUpdate: inflate("../sql/EventUpdate.sql"),
  EventClearSubscribers: inflate("../sql/EventClearSubscribers.sql"),
  EventAddSubscriber: inflate("../sql/EventAddSubscriber.sql"),
  EventUpdateEmailTemplate: inflate("../sql/EventUpdateEmailTemplate.sql"),
};
