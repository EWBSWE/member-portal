/**
 * Member controller
 *
 * @namespace controller.Member
 * @memberOf controller
 */

"use strict";

const crypto = require("crypto");

const Member = require("../../models/member.model");
const Payment = require("../../models/payment.model");
const OutgoingMessage = require("../../models/outgoing-message.model");
const ewbMail = require("../../components/ewb-mail");

/**
 * Returns all members.
 *
 * @memberOf controller.Member
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {object} next - Express next error function
 */
function index(req, res, next) {
  Member.index()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
}

function get(req, res, next) {
  if (!Number.isInteger(parseInt(req.params.id))) {
    let badRequest = new Error("Bad request.");
    badRequest.status = 400;
    return next(badRequest);
  }

  Member.get(req.params.id)
    .then((data) => {
      if (!data) {
        return res.sendStatus(404);
      }
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
}

function create(req, res, next) {
  if (!req.body.email) {
    let badRequest = new Error("Bad request.");
    badRequest.status = 400;
    return next(badRequest);
  }

  if (req.body.role) {
    const error = new Error("Create user is removed");
    return next(error);
  } else {
    Member.findBy({ email: req.body.email })
      .then((members) => {
        if (members.length > 0) {
          let existingMemberError = new Error("Member exists");
          existingMemberError.status = 400;
          return Promise.reject(existingMemberError);
        }

        return Member.create(req.body);
      })
      .then((data) => {
        res.status(201).json(data);
      })
      .catch((err) => {
        next(err);
      });
  }
}

function destroy(req, res, next) {
  Member.get(req.params.id)
    .then((member) => {
      if (
        (member.role === "admin" || member.role === "user") &&
        req.user.role !== "admin"
      ) {
        let forbidden = new Error("Forbidden");
        forbidden.status = 403;
        return Promise.reject(forbidden);
      }

      return Member.destroy(req.params.id);
    })
    .then(() => {
      res.sendStatus(204);
    })
    .catch((err) => {
      next(err);
    });
}

function authCallback(req, res, next) {
  res.redirect("/");
}

module.exports = {
  index,
  get,
  getPayments,
  create,
  destroy,
  authCallback,
};
