const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../../env"),
});

const mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

import { SqlProvider } from "../SqlProvider";
import { db } from "../db";
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository";
import logger = require("../config/logger");
import { OutgoingMessage } from "../outgoing-message/OutgoingMessage";

const repo = new OutgoingMessageRepository(db, SqlProvider);

type MailgunMessage = {
  to: string;
  from: string;
  subject: string;
  text: string;
};

async function check(repo: OutgoingMessageRepository): Promise<void> {
  const messages = await repo.fetch(10);
  for (const message of messages) {
    const result = await deliver(createMailgunMessage(message));
    if (result == MailgunDelivery.SUCCESS) {
      await repo.remove(message.id);
    } else {
      message.fail();
      await repo.update(message);
    }
  }
}

function createMailgunMessage(message: OutgoingMessage): MailgunMessage {
  return {
    to: message.recipient,
    from: message.sender,
    subject: message.subject,
    text: message.body,
  };
}

enum MailgunDelivery {
  SUCCESS,
  FAILED,
}

function deliver(message: MailgunMessage): Promise<MailgunDelivery> {
  return new Promise((resolve) => {
    mailgun.messages().send(message, (err: any, body: any) => {
      if (err) resolve(MailgunDelivery.FAILED);
      else resolve(MailgunDelivery.SUCCESS);
    });
  });
}

check(repo)
  .then(() => {
    logger.info("All done!");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
