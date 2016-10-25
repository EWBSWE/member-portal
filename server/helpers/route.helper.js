/**
 * Route helper
 *
 * Contains helper function related to endpoints and routes.
 *
 * @namespace helper.Route
 * @memberOf helper
 */
'use strict'

function validateEndpointArgs(body, mandatory) {
    // TODO work
}

/**
 * Creates a bad request error with status code 400
 *
 * @memberOf helper.Route
 *
 * @returns {Error} A bad request error
 */
function badRequest() {
    let badRequest = new Error('Bad request');
    badRequest.status = 400;
    return badRequest;
}

exports = {
    badRequest: badRequest,
};
