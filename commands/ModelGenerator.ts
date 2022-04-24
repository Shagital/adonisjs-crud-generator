import {BaseCommand, args, flags} from '@adonisjs/core/build/standalone'
import {
  pascalCase,
  getTableColumnsAndTypes,
  validateConnection,
  camelCase,
} from '../common/helpers'
import fs from 'fs'
import pluralize from 'pluralize'
import {IColumn, IPrimaryColumn} from '../types'

export default class ModelGenerator extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'crud:model'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Generate model and relationships for a table'

  @args.string({description: 'Table to generate model and relationships for'})
  public table: string

  @flags.boolean({description: 'Specify custom DB connection to use'})
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
    const dbInstance = this.application.container.use('Adonis/Lucid/Database')
    if (this.connection) {
      validateConnection(dbInstance, this.application.config, this.connection)
    }
    const tableColumns = getTableColumnsAndTypes(dbInstance, this.application.config)

    let tableName = this.table.toLowerCase()
    let columnTypes = await tableColumns(tableName, this.connection)

    let singular = pluralize.singular(tableName)
    let modelFile = `${__dirname}/../templates/model.txt`
    let pascalName = pascalCase(singular)

    let data = String(fs.readFileSync(modelFile))
    data = await this.generateString(data, {columnTypes, tableName, pascalName})

    fs.writeFileSync(`${this.application.appRoot}/app/Models/${pascalName}.ts`, data)
    process.exit()
  }

  private isDateTime(type: string): boolean {
    return ['timestamp', 'datetime', 'date'].includes(type)
  }

  private isDate(type: string): boolean {
    return type === 'date'
  }

  private async generateString(
    data: string,
    {columnTypes, tableName, pascalName}
  ): Promise<string> {
    this.logger.info('Generate model data')

    let columnDefinitions = ''

    let primary: IPrimaryColumn | undefined
    let relationships = ''
    let varImport = ''
    let updateHook = ''
    let createHook = ''
    let relationshipArray: string[] = []
    let imported = {}
    let methods = ''
    let otherImports = ''

    Object.keys(columnTypes).forEach((columnName) => {
        let column: IColumn = columnTypes[columnName]

        if (this.isDateTime(column.type)) {
          if (!imported['datetime']) {
            varImport += `\nimport { DateTime } from 'luxon'
import moment from 'moment'`

            methods += `
  private static formatDateTime(datetime) {
    let value = new Date(datetime)
    return datetime ? value.getFullYear() + "-" + (value.getMonth() + 1) + "-" + value.getDate() + " " +
            value.getHours() + ":" + value.getMinutes() + ":" + value.getSeconds() : datetime
  }`
            imported['datetime'] = true
          }

          if (this.isDate(column.type) && !imported['date']) {
            methods += `
  private static formatDate(datetime) {
    let value = new Date(datetime)
    return datetime ? value.getFullYear() + "-" + (value.getMonth() + 1) + "-" + value.getDate() : datetime
  }`
            imported['date'] = true
          }

          if (!imported[columnName]) {
            updateHook += `${
              ['datetime', 'timestamp'].includes(column.type)
                ? `\nif (_modelInstance.$dirty.${columnName}) {
                _modelInstance.${columnName} = this.formatDateTime(_modelInstance.${columnName})
                }`
                : ''
            }`
            createHook += `${
              ['datetime', 'timestamp'].includes(column.type)
                ? `\nif (_modelInstance.$dirty.${columnName}) {
                _modelInstance.${columnName} = this.formatDateTime(_modelInstance.${columnName})
                }`
                : ''
            }`
            createHook += `${
              column.type === 'date'
                ? `\nif (_modelInstance.$dirty.${columnName}) {
                _modelInstance.${columnName} = this.formatDate(_modelInstance.${columnName})
                }`
                : ''
            }`
          }
          imported[columnName] = true
        }

        if(column.original_type === 'json') {
          createHook += `${
            column.original_type === 'json'
              ? `\nif (_modelInstance.$dirty.${columnName}) {
              _modelInstance.${columnName} = JSON.stringify(_modelInstance.${columnName} || {})
              }`
              : ''
          }`
          updateHook += `${
            column.original_type === 'json'
              ? `\nif (_modelInstance.$dirty.${columnName}) {
              _modelInstance.${columnName} = JSON.stringify(_modelInstance.${columnName} || {})
              }`
              : ''
          }`
        }

        columnDefinitions += `
  @column${column.type === 'date' ? '.date' : ''}({`
        columnDefinitions += `${
          column.primary
            ? `
    isPrimary: true,`
            : ''
        }`
        columnDefinitions += `${columnName === 'password' ? 'serializeAs: null,' : ''}`
        columnDefinitions += `    ${
          ['timestamp', 'datetime'].includes(column.type)
            ? `
    serialize: (value: DateTime | null) => {
      return value ? moment(value).format('lll') : value
    }`
            : ''
        }`
        columnDefinitions += `    ${
          this.isDate(column.type)
            ? `
serialize: (value: DateTime | null) => {
  return value ? moment(value).format('ll') : value
}`
            : ''
        }`
        columnDefinitions += `
  })
  public ${columnName}: ${
          this.isDateTime(column.type)
            ? 'DateTime'
            : column.type === 'others'
              ? 'string'
              : column.type
        }\n`

        if (column.primary) {
          primary = {name: null, ...column}
          primary.name = columnName
        } else if (columnName === 'password') {
          varImport += `\nimport Hash from '@ioc:Adonis/Core/Hash'`
          createHook += `\n_modelInstance.password = await Hash.make(_modelInstance.password)`
        } else if (
          column.primary_table &&
          column.primary_column &&
          column.relation_name &&
          fs.existsSync(
            `${this.application.appRoot}/app/Models/${pascalCase(
              pluralize.singular(column.primary_table)
            )}.ts`
          )
        ) {
          let pascal = pascalCase(pluralize.singular(column.primary_table))
          let camel = camelCase(pluralize.singular(column.relation_name))

          relationshipArray.push(camel)
          if (!imported['belongsTo']) {
            otherImports += `, belongsTo, BelongsTo`
            imported['belongsTo'] = true
          }
          varImport += `\nimport ${pascal} from 'App/Models/${pascal}'`
          relationships += `\n@belongsTo(() => ${pascal})
  public ${camel}: BelongsTo<typeof ${pascal}>\n`
        }
      }
    )

    data = data
      .replace(new RegExp('{{pascalName}}', 'g'), pascalName)
      .replace(new RegExp('{{tableName}}', 'g'), tableName)
      .replace('{{primaryColumn}}', `${primary ? primary.name : 'null'}`)
      .replace('{{autoIncrement}}', `${primary && primary.autoincrement ? 'false' : 'true'}`)
      .replace('{{relationships}}', relationships)
      .replace('{{columnDefinitions}}', columnDefinitions)
      .replace('{{createHook}}', createHook)
      .replace('{{updateHook}}', updateHook)
      .replace('{{otherImports}}', `${otherImports} `)
      .replace(
        '{{relationshipArray}}',
        relationshipArray.length ? `['${relationshipArray.join("', '")}']` : '[]'
      )
      .replace('{{varImport}}', varImport)
      .replace('{{methods}}', methods)

    return data
  }
}
