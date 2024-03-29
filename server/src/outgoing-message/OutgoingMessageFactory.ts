import { OutgoingMessage, UnsavedOutgoingMessage } from "./OutgoingMessage";
import moment = require("moment");
import { EmailTemplate } from "../event/EmailTemplate";

export class OutgoingMessageFactory {
  private readonly noReplySender: string;
  private readonly appUrl: string;

  constructor(noReplySender: string, appUrl: string) {
    this.noReplySender = noReplySender;
    this.appUrl = appUrl;
  }

  userCreated(email: string): UnsavedOutgoingMessage {
    const subject = "New user";
    const signInUrl = this.appUrl + "/login";
    const body = `A user has been created.

Go to ${signInUrl} and click 'Forgot your password?' and follow the instructions to create a new password.`;
    return new UnsavedOutgoingMessage(email, this.noReplySender, subject, body);
  }

  resetPassword(email: string, token: string): UnsavedOutgoingMessage {
    const subject = "Reset password";
    const resetPasswordUrl = this.appUrl + `/reset-password?token=${token}`;
    const body = `
To reset your password go to ${resetPasswordUrl} and follow the instructions.

The URL is valid for 15 minutes.

If you haven't requested a password reset you can ignore this email.
`;
    return new UnsavedOutgoingMessage(email, this.noReplySender, subject, body);
  }

  // TODO update type when products migrated
  receipt(email: string, products: any[]): UnsavedOutgoingMessage {
    const subject = `Receipt ${products[0].name}`;
    const formattedDate = moment().format("YYYY-MM-DD HH:mm");
    const formattedProductList = products
      .map(
        (product) => `${product.name} ${product.price} ${product.currencyCode}`
      )
      .join("\n");
    const total = products.reduce((sum, product) => sum + product.price, 0);
    const body = `
Buyer: ${email}
Seller: Engineers Without Borders Sweden
Date: ${formattedDate}

---
${formattedProductList}
---
Total: ${total} SEK
VAT: 0 SEK

Kind regards,
Engineers Without Borders Sweden
www.ewb-swe.org
info@ewb-swe.org
`;
    return new UnsavedOutgoingMessage(email, this.noReplySender, subject, body);
  }

  fromTemplate(email: string, template: EmailTemplate): UnsavedOutgoingMessage {
    return new UnsavedOutgoingMessage(
      email,
      this.noReplySender,
      template.subject,
      template.body
    );
  }

  membership(email: string, expirationDate: Date): UnsavedOutgoingMessage {
    const subject = "Welcome to Engineers Without Borders Sweden!";

    const formattedExpiration = moment(expirationDate).format("YYYY-MM-DD");
    // TODO body in plain text should be moved to some simpler data format
    const body = `
Hello and thank you for supporting Engineers Without Borders Sweden!

We are happy that you decided to support our work. If you have any questions or thoughts regarding our organization, don't hesitate to get in touch with us.

Keep an eye out for news and updates on www.ewb-swe.org and available positions.

Your membership expires ${formattedExpiration}.

Follow us on Facebook, Instagram and LinkedIn!
http://www.facebook.com/ingenjorerutangranser
https://www.instagram.com/ewb_swe
https://www.linkedin.com/company/engineerswithoutborderssweden


Kind regards,
Engineers Without Borders Sweden
www.ewb-swe.org
info@ewb-swe.org
`;
    return new UnsavedOutgoingMessage(email, this.noReplySender, subject, body);
  }
}
