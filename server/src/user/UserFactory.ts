import { Role } from "./Role";
import { randomPassword, createResetToken } from "./PasswordService";
import { UnsavedUser } from "./User";

export class UserFactory {
    create(email: string): UnsavedUser {
        const user = new UnsavedUser(email, randomPassword(), Role.USER);
        user.resetToken = createResetToken();
        return user;
    }
}
