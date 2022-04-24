import { args, BaseCommand, flags } from '@adonisjs/core/build/standalone'
import { IColumn } from '../types'
import {
  pascalCase,
  getTableColumnsAndTypes,
  validateConnection,
  toSnakeCase,
  titleCase,
} from '../common/helpers'
import fs from 'fs-extra'
import pluralize from 'pluralize'

export default class ViewGenerator extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'crud:view'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Generate view templates for a table'

  @args.string({ description: 'Table to generate model and relationships for' })
  public table: string

  @flags.boolean({ description: 'Specify custom DB connection to use' })
  public connection: string

  private columns: Array<IColumn>

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

  private Env

  public async run() {
    this.Env = this.application.container.use('Adonis/Core/Env')
    const dbInstance = this.application.container.use('Adonis/Lucid/Database')
    if (this.connection) {
      validateConnection(dbInstance, this.application.config, this.connection)
    }

    const tableColumns = getTableColumnsAndTypes(dbInstance, this.application.config)
    let tableName = this.table.toLowerCase()
    let columnsTypes = await tableColumns(tableName, this.connection)
    let singular = pluralize.singular(tableName)
    let plural = pluralize.plural(tableName)
    let snakeCase = toSnakeCase(tableName)
    this.columns = columnsTypes

    let pascalName = pascalCase(singular)
    let pascalPlural = pluralize.plural(pascalName)

    Promise.all([
      this.copyAndUpdateViews({ pascalPlural, pascalName, singular, snakeCase }),
      this.updateRoutes({ plural, pascalName, pascalPlural }),
      this.copyAndUpdateStore({ singular, plural, pascalName }),
      this.updateStoreImport({ singular }),
      this.updateSidebar({ pascalPlural, plural }),
      this.updateTranslations({ snakeCase, pascalName, pascalPlural }),
    ]).then(() => {
      this.logger.info('Done')
      process.exit()
    }).catch(e => {
      console.log(e)
    })
  }

  private copyAndUpdateViews({ pascalPlural, pascalName, singular, snakeCase }) {
    this.logger.info('Setting up view file')

    // copy views
    fs.copySync(
      `${__dirname}/../templates/views`,
      this.application.viewsPath(`admin/src/views/${pascalPlural}`)
    )

    // update views
    let paths = [
      this.application.viewsPath(`admin/src/views/${pascalPlural}/Layout.vue`),
      this.application.viewsPath(`admin/src/views/${pascalPlural}/Form.vue`),
      this.application.viewsPath(`admin/src/views/${pascalPlural}/Index.vue`),
      this.application.viewsPath(`admin/src/views/${pascalPlural}/Filter.vue`),
    ]

    let inputFieldsMarker = ` <!-- insert input fields here. Do not remove -->`
    let columnsMarker = `// Insert columns here. Do not remove`

    for (let path of paths) {
      this.updateView({
        path,
        columnsMarker,
        inputFieldsMarker,
        pascalName,
        singular,
        pascalPlural,
        snakeCase,
      })
    }
  }

  private updateView({
    path,
    columnsMarker,
    inputFieldsMarker,
    pascalName,
    singular,
    pascalPlural,
    snakeCase,
  }) {
    let data = String(fs.readFileSync(path))

    let columns = this.generateVueTableColumns(snakeCase)
    let inputFields = this.generateInputFields(snakeCase)

    data = data
      .replace(new RegExp('{{pascalName}}', 'g'), pascalName)
      .replace(new RegExp('{{singular}}', 'g'), singular)
      .replace(new RegExp('{{pascalPlural}}', 'g'), pascalPlural)
      .replace(new RegExp('{{snakeCase}}', 'g'), snakeCase)

    if (!data.includes(inputFields)) {
      data = data.replace(inputFieldsMarker, inputFields)
    }

    if (!data.includes(columns)) {
      data = data.replace(columnsMarker, columns)
    }

    fs.writeFileSync(path, data)
  }

  private updateRoutes({ pascalName, plural, pascalPlural }) {
    this.logger.info('Setting up routes')

    // update route
    let importMarker = `// Import Model Components Here. Do not remove this line`
    let routeMarker = `// Import Model Routes Here. Do not remove this line`
    let routePath = this.application.viewsPath(`admin/src/router/index.js`)

    let data = String(fs.readFileSync(routePath))
    let imports = `
// ${pascalPlural}
import ${pascalName} from "@/views/${pascalPlural}/Layout.vue";
import ${pascalName}Index from "@/views/${pascalPlural}/Index.vue";
import ${pascalName}Form from "@/views/${pascalPlural}/Form.vue";
`

    let routes = `
      {
        path: "/${plural}",
        name: "${pascalPlural}",
        redirect: "/${plural}/index",
        components: {default:${pascalName}},
        meta: {auth: true},
        children: [
          {
            path: "index",
            name: "${pascalPlural}Index",
            component: ${pascalName}Index,
          },
          {
            path: "create",
            name: "${pascalPlural}New",
            component: ${pascalName}Form,
          },
          {
            path: ":id",
            name: "${pascalPlural}Edit",
            component: ${pascalName}Form,
          },
        ]
      },`

    if (!data.includes(imports + importMarker)) {
      data = data.replace(importMarker, imports + importMarker)
    }

    if (!data.includes(routes + routeMarker)) {
      data = data.replace(routeMarker, routes + routeMarker)
    }

    fs.writeFileSync(routePath, data)
  }

  private copyAndUpdateStore({ singular, plural, pascalName }) {
    this.logger.info('Setting up vuex store')

    // copy store
    fs.copySync(
      `${__dirname}/../templates/store`,
      this.application.viewsPath(`admin/src/store/${singular}`)
    )

    // update store
    let paths = [
      this.application.viewsPath(`admin/src/store/${singular}/actions.js`),
      this.application.viewsPath(`admin/src/store/${singular}/getters.js`),
      this.application.viewsPath(`admin/src/store/${singular}/mutations.js`),
      this.application.viewsPath(`admin/src/store/${singular}/store.js`),
    ]

    const baseUrl = `${this.Env.get('APP_URL')}/${this.application.config.get('crudGenerator.admin_prefix')}`

    for (let path of paths) {
      let data = fs.readFileSync(path, 'utf8')

      data = data
        .replace(new RegExp(`{{baseUrl}}`, 'g'), baseUrl)
        .replace(new RegExp(`{{plural}}`, 'g'), plural)
        .replace(new RegExp(`{{singular}}`, 'g'), singular)
        .replace(new RegExp(`{{pascalCapital}}`, 'g'), pascalName.toUpperCase())

      fs.writeFileSync(path, data, 'utf8')
    }
  }

  private updateStoreImport({ singular }) {
    this.logger.info('Completing store setup')

    // update store import
    let storePath = this.application.viewsPath(`admin/src/store/index.js`)
    let storeImportMarker = `// Add new store. Don't remove this line`
    let storeExportMarker = `// export new store. Don't remove this line`

    let data = String(fs.readFileSync(storePath))

    if (!data.includes(`import {${singular}} from './${singular}/store';\n` + storeImportMarker)) {
      data = data.replace(
        storeImportMarker,
        `import {${singular}} from './${singular}/store';\n` + storeImportMarker
      )
    }

    if (!data.includes(`${singular},\n` + storeExportMarker)) {
      data = data.replace(storeExportMarker, `${singular},\n` + storeExportMarker)
    }

    fs.writeFileSync(storePath, data)
  }

  private updateTranslations({ snakeCase, pascalName, pascalPlural }) {
    this.logger.info('Updating translations')

    // update store import
    let translationPath = this.application.viewsPath(`admin/src/locales/en.json`)

    let jsonString = String(fs.readFileSync(translationPath))
    let data: Object = JSON.parse(jsonString)

    let jsonData = {
      name: pascalName,
      title: pascalName,
      plural: pascalPlural,
      column: {},
    }

    let column = {}
    Object.keys(this.columns).forEach((columnName) => {
      column[toSnakeCase(columnName)] = titleCase(columnName)
    })

    jsonData.column = column

    if (!data[snakeCase]) {
      data[snakeCase] = jsonData
    } else {
      let existingColumns = data[snakeCase].column || {}
      jsonData.column = { ...existingColumns, ...jsonData.column }
      data[snakeCase] = { ...data[snakeCase], ...jsonData }
    }

    jsonString = JSON.stringify(data)

    fs.writeFileSync(translationPath, jsonString)
  }

  private async updateSidebar({ plural, pascalPlural }) {
    this.logger.info('Adding links to sidebar')

    // update store import
    let path = this.application.viewsPath(`admin/src/components/Sidebar.vue`)
    let marker = `<!-- INSERT NEW ENDPOINTS HERE. DO NOT REMOVE THIS LINE -->`

    let routeString = `
    <div
          :class="\`items-center duration-200 mt-4 py-2 px-6 border-l-4 \${$route.path.includes('${plural}') ? activeClass : inactiveClass}\`"
          @click="toggleExpandMenu('${plural}')"
          > <i class="icon-expand-alt"></i> ${pascalPlural}
          <ul v-if="expandedMenu == '${plural}'" class="p-3">
        <li class="p-2"><router-link

        :class="$route.name == '${pascalPlural}Index' ? activeChildClass : inactiveChildClass"
          :to="{name: '${pascalPlural}Index'}"
        >
          <i class="icon-list"></i>Index
        </router-link></li>
       <li class="p-2"> <router-link

          :class="$route.name == '${pascalPlural}New' ? activeChildClass : inactiveChildClass"
          :to="{name: '${pascalPlural}New'}"
        >
          <i class="icon-plus"></i>Create
        </router-link>
       </li>

    </ul>
    </div>
`
    let data = String(fs.readFileSync(path))

    if (!data.includes(routeString + marker)) {
      data = data.replace(marker, routeString + marker)
    }

    fs.writeFileSync(path, data)
  }

  private generateInputFields(snakeCase) {
    let columns = this.columns
    let string = ''

    Object.keys(columns).forEach((columnName) => {
      if (
        !columns[columnName].primary &&
        !['created_at', 'updated_at', 'deleted_at'].includes(columnName)
      ) {
        let column = columns[columnName]
        let validationRules = column.nullable ? '' : 'required|'
        let columnType

        switch (column['type']) {
          case 'string':
            columnType = column.length > 100 ? 'textarea' : 'text'
            validationRules += column.length > 0 ? `|max:${column.length}` : ''
            break
          case 'number':
            columnType = 'number'
            validationRules += `decimal`
            validationRules += column.length > 0 ? `|max:${column.length}` : ''
            break
          case 'datetime':
            columnType = 'datetime-local'
            break
          case 'date':
            columnType = 'date'
            break
          case 'boolean':
            columnType = 'checkbox'
            break
          default:
            columnType = columnName.includes('url') ? 'url' : 'text'
        }

        // if column name seem like email/password
        if (columnName.includes('email')) {
          columnType = 'email'
          validationRules += `|email`
        }

        if (columnName.includes('password')) {
          columnType = 'password'
          validationRules += `|min:8`
        }

        validationRules =
          validationRules.slice(-1) === '|' ? validationRules.slice(0, -1) : validationRules
        validationRules =
          validationRules.charAt(0) === '|' ? validationRules.substring(1) : validationRules

        string += `
<div >
      <label class="text-gray-700" for="${columnName}"><b>{{$t('${snakeCase}.column.${columnName}')}}</b> </label>

      <${columnType === 'textarea' ? 'textarea' : 'input'} ${
          column.length > 0 ? `max="${column.length}" step="any"` : ''
        } name="${columnName}" v-validate="'${validationRules}'" v-model="body.${columnName}" class="${columnType === 'checkbox' ? '' : 'form-input w-full mt-2 rounded-md focus:border-indigo-600'}" type="${columnType}">
    ${columnType === 'checkbox' ? `<hr>` : columnType === 'textarea' ? '</textarea>' : ''}
    <small
    class="text-red-800"
      v-show="errors.has('${columnName}')"
    >{{errors.first('${columnName}')}}</small>

  </div>
`
      }
    })
    return string
  }

  private generateVueTableColumns(snakeCase) {
    let columns = this.columns
    let string = ''

    Object.keys(columns).forEach((columnName) => {
      let column = columns[columnName]

      string += `
{
  name: "${columnName}",
  title: () => { return this.$t('${snakeCase}.column.${toSnakeCase(columnName)}')},
  active: true,
  ${['number', 'datetime', 'date'].includes(column.type) ? `sortField: '${columnName}',` : ``}
  ${
    column.type === 'string' && column.length > 100
      ? `
  callback: s => {
    return truncate(s)
  }
 `
      : ``
  }
},
`
    })

    return string
  }
}
