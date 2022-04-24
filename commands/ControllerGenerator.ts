import { BaseCommand, flags, args } from '@adonisjs/core/build/standalone'
import { pascalCase, getTableColumnsAndTypes, validateConnection } from '../common/helpers'
import fs from 'fs'
import pluralize from 'pluralize'

export default class ControllerGenerator extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'crud:controller'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Generate controller and route for a table'

  @args.string({ description: 'Table to generate controller and routes for' })
  public table: string

  @flags.boolean({ description: 'Specify custom DB connection to use' })
  public connection: string

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process
     */
    stayAlive: false,
  }

  public async run() {
    this.logger.info('Starting controller generator')
    const dbInstance = this.application.container.use('Adonis/Lucid/Database')
    if (this.connection) {
      await validateConnection(dbInstance, this.application.config, this.connection)
    }

    const tableColumns = getTableColumnsAndTypes(dbInstance, this.application.config)

    let tableName = this.table.toLowerCase()
    const columnTypes = await tableColumns(tableName, this.connection)

    let singular = pluralize.singular(tableName)
    let plural = pluralize.plural(tableName)

    let controllerFile = `${__dirname}/../templates/controller.txt`
    let pascalName = pascalCase(singular)
    let pascalNamePlural = pluralize.plural(pascalName)

    let prefix = this.application.config.get('crudGenerator.admin_prefix')
    let data = String(fs.readFileSync(controllerFile))
    let controllerPath = `${this.application.appRoot}/app/Controllers/Http/Admin/${pascalNamePlural}Controller.ts`
    let newData = await this.generateString(data, {
      prefix,
      columnTypes,
      singular,
      tableName,
      pascalName,
      pascalNamePlural,
    })

    fs.writeFileSync(controllerPath, newData)

    // update application route file with new routes
    this.logger.info('Add routes')
    this.addRoutes({ prefix, plural, pascalNamePlural })
  }

  private async generateString(
    data: string,
    { prefix, columnTypes, singular, tableName, pascalName, pascalNamePlural }
  ) {
    this.logger.info('Generate controller data')
    let columns = Object.keys(columnTypes)
    let filteredColumns: string[] = []

    // get all columns except primary
    Object.keys(columnTypes).forEach((columnName) => {
      if (!columnTypes[columnName].primary) {
        filteredColumns.push(columnName)
      }
    })

    let filters = ''
    let rules = ''

    Object.keys(columnTypes).forEach((columnName) => {
      let isPrimary = columnTypes[columnName]['primary']
      let columnRule = `${columnName}:`
      let column = columnTypes[columnName]
      let filterValue = `qs.${columnName}`

      switch (column['type']) {
        case 'string':
        case 'others':
          columnRule += `${
            column.nullable ? 'schema.string.optional({}, [\n' : 'schema.string({}, [\n'
          }`
          columnRule += column.length > 0 ? `rules.maxLength(${column.length}),` : ''

          if (columnName !== 'password') {
            filters += `
    if (${filterValue}) {
    query.where('${columnName}', 'LIKE', "%" + ${filterValue} + "%")
    }
        `
          }
          break
        case 'number':
          columnRule += `${
            column.nullable ? ' schema.number.optional([\n' : ' schema.number([\n'
          }`
          columnRule += column.length > 0 ? `rules.maxLength(${column.length}),` : ''

          filters += `
    if (${filterValue}) {
      query.where('${columnName}', ${filterValue})
    }
        `
          break
        case 'datetime':
          columnRule += `${column.nullable ? 'schema.date.optional({}, [' : 'schema.date({}, [\n'}`

          filters += `
    if (${filterValue}_from) {
      query.where('${columnName}', '>=', moment(${filterValue}).format('YYYY-MM-DD HH:mm:ss'));
    }
    if (${filterValue}_to) {
      query.where('${columnName}', '<=', moment(${filterValue}).format('YYYY-MM-DD HH:mm:ss'));
    }
        `
          break
        case 'date':
          columnRule += `${
            column.nullable ? 'schema.date.optional({}, [\n' : 'schema.date({}, [\n'
          }`

          filters += `
    if (${filterValue}_from) {
      query.where('${columnName}', '>=', moment(${filterValue}).format('YYYY-MM-DD'));
    }
    if (${filterValue}_to) {
      query.where('${columnName}', '<=', moment(${filterValue}).format('YYYY-MM-DD'));
    }
       `
          break
        case 'boolean':
          columnRule += `${
            column.nullable ? 'schema.boolean.optional([' : 'schema.boolean(['
          },`

          filters += `
    if (${filterValue}) {
      query.where('${columnName}', !!${filterValue});
    }
       `
          break
      }

      if (column.unique) {
        let uniqueRuleWhere = `{
          table: '${tableName}',
          column: '${columnName}',
          caseInsensitive: true,
          where: {
            ${columnName}: params.${columnName},
          }
        }`
        let uniqueRuleWhereNot = `{
          table: '${tableName}',
          column: '${columnName}',
          caseInsensitive: true
        }`
        columnRule += `${
          column.unique
            ? `rules.unique(Object.keys(params).length > 0 ? ${uniqueRuleWhere} : ${uniqueRuleWhereNot}),`
            : ''
        }`
      }

      // if column name seem like email/password
      columnRule += `${columnName.includes('email') ? 'rules.email(),' : ''}`
      columnRule += `${columnName.includes('password') ? 'rules.minLength(8)' : ''}`
      columnRule = columnRule.slice(-1) === ',' ? columnRule.slice(0, -1) : columnRule
      rules +=
        !isPrimary && !['created_at', 'updated_at', 'deleted_at'].includes(columnName)
          ? `   ${columnRule}\n]),\n`
          : ''
    })

    data = data
      .replace(new RegExp('{{pascalNamePlural}}', 'g'), pascalNamePlural)
      .replace(new RegExp('{{singularName}}', 'g'), singular)
      .replace(new RegExp('{{pluralName}}', 'g'), tableName)
      .replace(new RegExp('{{pascalName}}', 'g'), pascalName)
      .replace(new RegExp('{{tableColumns}}', 'g'), `['${columns.join("', '")}']`)
      .replace(new RegExp('{{filteredColumns}}', 'g'), `['${filteredColumns.join("','")}']`)
      .replace(new RegExp('{{filters}}', 'g'), filters)
      .replace(new RegExp('{{rulesArray}}', 'g'), rules)
      .replace(new RegExp('{{prefix}}', 'g'), `/${prefix}`)

    return data
  }

  private async addRoutes({ prefix, plural, pascalNamePlural }) {
    let string = `
Route.group(() => {
  Route.resource('${plural}', 'Admin/${pascalNamePlural}Controller')
})
  .prefix('${prefix}')
  .middleware(['auth:api', 'is:administrator'])`

    let routeFile = this.application.startPath('routes.ts')
    let data = String(fs.readFileSync(routeFile))
    if (!data.includes(string)) {
      data += `${string}\n`
    }

    fs.writeFileSync(routeFile, data)
    process.exit()
  }
}
