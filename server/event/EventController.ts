import { EventRepository } from "./EventRepository";
import { Event, UnsavedEvent, check } from "./Event";
import { EventSubscriber, UnsavedEventSubscriber } from "./EventSubscriber";
import { EmailTemplate, UnsavedEmailTemplate } from "./EmailTemplate";
import { UnsavedEventProduct } from "./EventProduct";

type AllEventsResponse = {
  id: number;
  name: string;
  identifier: string;
  active: boolean;
  due_date: Date;
  notificationOpen: boolean;
  created_at: Date;
  participants: { email: string }[];
}[];

function createAllEventsResponse(events: Event[]): AllEventsResponse {
  return events.map((event) => {
    return {
      id: event.id!,
      name: event.name,
      identifier: event.identifier,
      active: event.active,
      due_date: event.dueDate,
      notificationOpen: event.notificationOpen,
      created_at: event.createdAt!,
      participants: event.participants!.map((participant) => ({
        email: participant.email,
      })),
    };
  });
}

type DetailedEventResponse = {
  id: number;
  name: string;
  identifier: string;
  active: boolean;
  due_date: Date;
  notification_open: boolean;
  created_at: Date;
  description: string;
  emailTemplate: { subject: string; body: string };
  subscribers: { email: string }[];
  participants: { email: string }[];
  payments: {
    name: string;
    email: string;
    amount: number;
    addons: number[];
    message: string | null;
  }[];
  addons: {
    id: number;
    product_id: number;
    name: string;
    price: number;
    capacity: number;
    description: string;
  }[];
};

function createDetailedEventResponse(event: Event): DetailedEventResponse {
  return {
    id: event.id!,
    name: event.name,
    identifier: event.identifier,
    active: event.active,
    due_date: event.dueDate,
    notification_open: event.notificationOpen,
    created_at: event.createdAt!,
    description: event.description,
    emailTemplate: {
      subject: event.emailTemplate!.subject,
      body: event.emailTemplate!.body,
    },
    subscribers: event.subscribers.map((subscriber) => ({
      email: subscriber.email,
    })),
    participants: event.participants.map((participant) => ({
      email: participant.email,
    })),
    payments: event.payments.map((payment) => ({
      name: payment.name,
      email: payment.email,
      amount: payment.amount,
      addons: payment.addons,
      message: payment.message,
    })),
    addons: event.addons.map((addon) => ({
      id: addon.id,
      product_id: addon.productId,
      name: addon.name,
      price: addon.price,
      capacity: addon.capacity,
      description: addon.description,
    })),
  };
}

type PublicEventResponse = {
  id: number;
  name: string;
  description: string;
  identifier: string;
  active: boolean;
  due_date: Date;
  notification_open: boolean;
  created_at: Date;
  addons: {
    id: number;
    product_id: number;
    name: string;
    price: number;
    capacity: number;
    description: string;
  }[];
};

function createPublicEventResponse(event: Event): PublicEventResponse {
  return {
    id: event.id!,
    name: event.name,
    description: event.description,
    identifier: event.identifier,
    active: event.active,
    due_date: event.dueDate,
    notification_open: event.notificationOpen,
    created_at: event.createdAt!,
    addons: event.addons!.map((addon) => ({
      id: addon.id,
      product_id: addon.productId,
      name: addon.name,
      price: addon.price,
      capacity: addon.capacity,
      description: addon.description,
    })),
  };
}

type UpdateEventRequest = {
  id: number;
  name: string;
  description: string;
  identifier: string;
  active: boolean;
  dueDate: Date;
  emailTemplate: { subject: string; body: string };
  notificationOpen: boolean;
  subscribers: string[];
  addons: {
    id: number;
    capacity: number;
    description: string;
    name: string;
    price: number;
    product_id: number;
  }[];
};

type CreateEventRequest = {
  name: string;
  identifier: string;
  description: string;
  active: boolean;
  contact: string;
  emailTemplate: {
    subject: string;
    body: string;
  };
  notificationOpen: boolean;
  subscribers: string[];
  dueDate: string;
  addons: {
    name: string;
    price: number;
    description: string;
    capacity: number;
  }[];
};

type CreateAddonRequest = {
  name: string;
  description: string;
  price: number;
  capacity: number;
};

export class EventController {
  private readonly eventRepository: EventRepository;

  constructor(eventRepository: EventRepository) {
    this.eventRepository = eventRepository;
  }

  async all(): Promise<AllEventsResponse> {
    const events = await this.eventRepository.findAll();
    return createAllEventsResponse(events);
  }

  async show(id: number): Promise<DetailedEventResponse> {
    const event = await this.eventRepository.find(id);
    if (event == null) throw new Error(`Event with id ${id} not found`);
    return createDetailedEventResponse(event);
  }

  async showPublic(slug: string): Promise<PublicEventResponse> {
    const event = await this.eventRepository.findByPublicIdentifier(slug);
    if (event == null) throw new Error(`Event with slug ${slug} was not found`);
    return createPublicEventResponse(event);
  }

  async update(request: UpdateEventRequest): Promise<void> {
    const event = await this.eventRepository.find(request.id);
    if (event == null) throw new Error(`Event with id ${request.id} not found`);

    // TODO best way to validate request?
    event.name = request.name;
    event.description = request.description;
    event.identifier = request.identifier;
    event.active = request.active;
    event.dueDate = request.dueDate;
    event.notificationOpen = request.notificationOpen;

    event.subscribers = request.subscribers.map(
      (email) => new EventSubscriber(event.id!, email)
    );

    event.emailTemplate.subject = request.emailTemplate.subject;
    event.emailTemplate.body = request.emailTemplate.body;

    await this.eventRepository.update(event);
  }

  async create(request: CreateEventRequest): Promise<void> {
    const sameSlugEvent = await this.eventRepository.findByPublicIdentifier(
      request.identifier
    );
    if (sameSlugEvent != null)
      throw new Error(
        `Already exists an event with identifier ${request.identifier}`
      );
    // TODO validate request -> Joi?
    const emailTemplate = new UnsavedEmailTemplate(
      request.emailTemplate.subject,
      request.emailTemplate.body,
      check(process.env.EWB_SENDER)
    );

    const products = request.addons.map(
      (p) => new UnsavedEventProduct(p.name, p.price, p.capacity, p.description)
    );
    if (products.length === 0) throw new Error("No products");
    const subscribers = request.subscribers.map(
      (email) => new UnsavedEventSubscriber(email)
    );
    if (subscribers.length === 0) throw new Error("No subscribers");

    const event = new UnsavedEvent(
      request.name,
      request.description,
      request.identifier,
      !!request.active,
      new Date(request.dueDate),
      !!request.notificationOpen,
      products,
      subscribers,
      emailTemplate
    );
    await this.eventRepository.create(event);
  }

  async destroy(id: number): Promise<void> {
    await this.eventRepository.destroy(id);
  }

  async createAddon(
    eventId: number,
    request: CreateAddonRequest
  ): Promise<void> {
    const event = await this.eventRepository.find(eventId);
    if (event == null) throw new Error(`No event found with id ${eventId}`);
    const product = new UnsavedEventProduct(
      request.name,
      request.price,
      request.capacity,
      request.description
    );
    await this.eventRepository.attachAddon(event, product);
  }

  async deleteAddon(eventId: number, addonId: number): Promise<void> {
    await this.eventRepository.destroyAddon(addonId);
  }
}
