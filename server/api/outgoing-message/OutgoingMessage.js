'use strict';

const moment = require('moment');

// TODO move this to some sort of env-variable?
// TODO should maybe ewb-swe.org instead?
const DEFAULT_SENDER = 'Ingenjörer utan gränser <volontar@ingenjorerutangranser.se>';
const NO_REPLY = 'noreply@ingenjorerutangranser.se';

class OutgoingMessage {
  constructor(id, recipient, sender, subject, body, failedAttempts, sendAt, priority) {
    this.id = id;
    this.recipient = recipient;
    this.sender = sender;
    this.subject = subject;
    this.body = body;
    this.failedAttempts = failedAttempts;
    this.sendAt = sendAt || new Date();
    this.priority = priority;
  }

  static createReceipt(recipient, products) {
    const subject = `Kvitto ${products[0].name}`;

    // TODO this date should take server timezone into account
    const formattedDate = moment().format('YYYY-MM-DD HH:mm');
    const formattedProductList = products
	  .map(p => `${p.name} ${p.price} ${p.currencyCode}`)
	  .join('\n');
    const total = products.reduce((total, product) => total + product.price, 0);

    // TODO body in plain text should be moved to some simpler data format
    const body = `
Köpare: ${recipient}
Säljare: Ingenjörer utan gränser
Datum: ${formattedDate}

---
${formattedProductList}
---
Totalt: ${total} SEK
Momsbelopp: 0 SEK

Vänliga hälsningar,
Ingenjörer utan gränser
www.ewb-swe.org
volontar@ingenjorerutangranser.se
`;

    console.log(body);
    console.log(total);

    return new OutgoingMessage(null, recipient, DEFAULT_SENDER, subject, body);
  }

  static createMembership(member) {
    const subject = 'Welcome to Engineers without borders!';

    const expirationDate = moment(member.expirationDate).format('YYYY-MM-DD');
    // TODO body in plain text should be moved to some simpler data format
    const body = `
Hello and thank you for supporting Engineers without borders!

We are happy that you decided to support our work. If you have any questions or thoughts regarding our organization, don't hesitate to get in touch with us.

Keep an eye out for news and updates on www.ewb-swe.org and available positions.

Your membership expires ${expirationDate}.

Follow us on Facebook and Twitter!
http://www.facebook.com/ingenjorerutangranser
https://twitter.com/EWB_Ingenjorer

Kind regards,
Engineers without borders
www.ewb-swe.org
volontar@ingenjorerutangranser.se
`;

    return new OutgoingMessage(null, member.email, DEFAULT_SENDER, subject, body);
  }
}

module.exports = { OutgoingMessage };
