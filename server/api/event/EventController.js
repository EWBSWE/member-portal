'use strict'

const db = require('../../db/futureDb')
const { EventRepository } = require('./EventRepository')
const eventRepository = new EventRepository(db)

async function all () {
  const events = await eventRepository.findAll()
  return events.map(e => e.formatResponse())
}

async function show (params, urlParams) {
  const eventId = urlParams.id
  const event = await eventRepository.find(eventId)
  if (!event) {
    throw new Error('Event not found')
  }
  return event.formatResponse()
}

async function showPublicEvent (params) {
  const event = await eventRepository.findByPublicIdentifier(params.identifier)
  if (!event) {
    throw new Error('Event not found')
  }
  return event.formatPublicResponse()
}

async function create (params) {
  throw new Error('Not implemented')
}

async function update (params) {
  throw new Error('Not implemented')
}

async function addParticipant (params) {
  throw new Error('Not implemented')
}

async function destroy (params) {
  throw new Error('Not implemented')
}

module.exports = {
  all,
  show,
  showPublicEvent,
  create,
  update,
  addParticipant,
  destroy,
}
