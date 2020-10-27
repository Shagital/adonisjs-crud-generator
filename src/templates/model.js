'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
{{hash}}

class {{pascalName}} extends Model {
  static boot () {
    super.boot()
    {{hooks}}
  }

  static get createdAtColumn () {
    return {{createdAt}}
  }

  static get updatedAtColumn () {
    return {{updatedAt}}
  }

  static get primaryKey () {
    return '{{primaryColumn}}'
  }

  static get incrementing () {
    return {{autoIncrement}}
  }

  static get dates () {
    return super.dates.concat({{dates}})
  }

  static formatDates (field, value) {
    if (typeof value === 'string') {
      value = new Date(value);
    }

    {{dateFormat}}
    return super.formatDates(field, value)
  }

  static castDates (field, value) {
    {{dateCast}}
    return super.formatDates(field, value)
  }

  static get table () {
    return '{{tableName}}'
  }

  static get hidden () {
    return {{hiddenColumns}}
  }

  {{relationships}}

  static allowedRelationships() {
    return {{relationshipArray}}
  }

}

module.exports = {{pascalName}}
