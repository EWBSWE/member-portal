import { OutgoingMessage } from "./OutgoingMessage";

export class OutgoingMessageFactory {
    private readonly noReplySender: string;
    private readonly signInUrl: string;

    constructor(noReplySender: string, signInUrl: string) {
        this.noReplySender = noReplySender;
        this.signInUrl = signInUrl;
    }

    userCreated(email: string): OutgoingMessage {
        const subject = "New user";
        const body = `A user has been created.

Go to ${this.signInUrl} and click 'Forgot your password?' and follow the instructions to create a new password.`;
        return new OutgoingMessage(email, this.noReplySender, subject, body);
    }
}
