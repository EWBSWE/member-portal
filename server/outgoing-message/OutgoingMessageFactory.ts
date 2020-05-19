import { OutgoingMessage } from "./OutgoingMessage";

export class OutgoingMessageFactory {
    private readonly noReplySender: string;
    private readonly appUrl: string

    constructor(noReplySender: string, appUrl: string) {
        this.noReplySender = noReplySender
        this.appUrl = appUrl
    }

    userCreated(email: string): OutgoingMessage {
        const subject = "New user";
        const signInUrl = this.appUrl + "/login"
        const body = `A user has been created.

Go to ${signInUrl} and click 'Forgot your password?' and follow the instructions to create a new password.`;
        return new OutgoingMessage(email, this.noReplySender, subject, body);
    }

    resetPassword(email: string, token: string): OutgoingMessage {
        const subject = "Reset password"
        const resetPasswordUrl = this.appUrl + `/reset-password?token=${token}`
        const body = `
To reset your password go to ${resetPasswordUrl} and follow the instructions.

The URL is valid for 15 minutes.

If you haven't requested a password reset you can ignore this email.
`
        return new OutgoingMessage(email, this.noReplySender, subject, body)
    }
}
