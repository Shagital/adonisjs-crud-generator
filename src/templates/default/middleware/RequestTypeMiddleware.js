'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class RequestTypeMiddleware {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request }, next) {
    // call next to advance the request
    request.is_ajax = (
      request.header("X-Requested-With") == "XMLHttpRequest"
      || (
        request.header('Accept')
        && request.header('Accept').includes('application/json')
      )
    );
    await next()
  }
}

module.exports = RequestTypeMiddleware
