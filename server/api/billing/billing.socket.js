/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Billing = require('./billing.model');

exports.register = function(socket) {
  Billing.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Billing.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('billing:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('billing:remove', doc);
}