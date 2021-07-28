'use strict'
/** @typedef {import('../../../Models/{{pascalName}}')} */
const {{pascalName}} = use("App/Models/{{pascalName}}");
const tableColumns = {{tableColumns}};
const moment = use("moment");
const {validateAll} = use("Validator");
const allowedRelationships = {{pascalName}}.allowedRelationships();

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with {{pluralName}}
 */
class {{pascalName}}Controller {
  /**
   * Show a list of all {{pluralName}}.
   * GET {{pluralName}}
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    let is_ajax = request.is_ajax;
    let qs = request.get();
    let query = {{pascalName}}.query();

    {{filters}}

    if(qs.with) {
      let requestedRelationships = qs.with.split(',');
      for(let relationship of requestedRelationships) {
        if(allowedRelationships.includes(relationship)) {
          query.with(relationship);
        }
      }
    }

    let orderBy = {{pascalName}}.primaryKey;
    let order = 'desc';
    if(qs.sort) {
      let split = qs.sort.split('|');

      if(tableColumns.includes(split[0]) && ['desc', 'asc'].includes(split[1].toLowerCase())) {
        orderBy = split[0];
        order = split[1].toLowerCase();
      }
    }
    query.orderBy(orderBy, order);

    let data = await query.paginate(qs.page || 1, qs.per_page || 25);

    if(is_ajax) {
      return response.send(data)
    }

    /* Uncomment to use view templates instead */
    // view.render('admin.{{singularName}}.index', data);
  }

  /**
   * Render a form to be used for creating a new {{singularName}}.
   * GET {{pluralName}}/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
    view.render('admin.{{singularName}}.create');
  }

  /**
   * Create/save a new {{singularName}}.
   * POST {{pluralName}}
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ params, request, session, response }) {
    let is_ajax = request.is_ajax;
    const data = request.only({{filteredColumns}});
    const rules = {
    {{rulesArray}}
  };

    const validation = await validateAll(data, rules)

    if (validation.fails()) {
      if(is_ajax) {
        return response.status(422).send(validation.messages())
      }

      /* Uncomment to use view templates instead */
      // session.withErrors(validation.messages()).flashAll()
      // return response.redirect('back')
    }

    let {{singularName}} = await {{pascalName}}.create(data);
    let message = "{{pascalName}} created successfully";
    if(is_ajax) {
      return response.status(201).send({message: message, data: {{singularName}}});
    }

    /* Uncomment to use view templates instead */
    // session.flash({'alert-success': message})
    // response.redirect('back')
  }

  /**
   * Display a single {{singularName}}.
   * GET {{pluralName}}/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
    let is_ajax = request.is_ajax;
    let {{singularName}} = await {{pascalName}}.findOrFail(params.id);

    let data = {data: {{singularName}}};

    if(is_ajax) {
      return response.send(data);
    }

    /* Uncomment to use view templates instead */
    // view.render('admin.{{singularName}}.show', data)
  }

  /**
   * Render a form to update an existing {{singularName}}.
   * GET {{pluralName}}/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
    view.render('admin.{{singularName}}.edit');
  }

  /**
   * Update {{singularName}} details.
   * PUT or PATCH {{pluralName}}/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, session, response }) {
    let is_ajax = request.is_ajax;
    const rules = {
    {{rulesArray}}
  };
    const data = request.only({{filteredColumns}});
    const validation = await validateAll(data, rules)

    if (validation.fails()) {
      if(is_ajax) {
        return response.status(422).send(validation.messages())
      }

      /* Uncomment to use view templates instead */
      // session.withErrors(validation.messages()).flashAll()
      // return response.redirect('back')
    }

    let {{singularName}} = await {{pascalName}}.findOrFail(params.id);
    let filledData = {};
    Object.keys(data).forEach(input => {
      if(data[input]) filledData[input] = data[input];
    })

    await {{pascalName}}.query()
      .where('id', params.id)
      .update(filledData)

    let message = "{{pascalName}} updated successfully";

    if(is_ajax) {
      return response.status(200).send({message: message, data: {{singularName}}});
    }

    /* Uncomment to use view templates instead */
    // session.flash({'alert-success': message});
    // response.redirect('back');
  }

  /**
   * Delete a {{singularName}} with id.
   * DELETE {{pluralName}}/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, session, response }) {
    let is_ajax = request.is_ajax;
    let {{singularName}} = await {{pascalName}}.findOrFail(params.id);

    {{singularName}}.delete();

    if(is_ajax) {
      return response.status(204).send('');
    }

    /* Uncomment to use view templates instead */
    // session.flash({'alert-success': `{{pascalName}} #${params.id} deleted successfully`});
    // response.redirect('back');
  }
}

module.exports = {{pascalName}}Controller
