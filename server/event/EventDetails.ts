import { EventProductEntity } from "../api/event/EventProductEntity";
import { EventSubscriberEntity } from "../api/event/EventSubscriberEntity";
import { EventPaymentEntity } from "../api/event/EventPaymentEntity";
import { EmailTemplateEntity } from "../api/event/EmailTemplateEntity";

export type EventDetails = {
    addons: EventProductEntity[];
    subscribers: EventSubscriberEntity[];
    payments: EventPaymentEntity[];
    emailTemplate: EmailTemplateEntity;
};
