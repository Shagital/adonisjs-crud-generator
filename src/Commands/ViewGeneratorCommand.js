'use strict'

const {Command} = require('@adonisjs/ace');
const Config = use('Config');
const Env = use('Env');
const Helpers = use('Helpers');
const {pascalCase, getTableColumnsAndTypes, validateConnection} = require(`${__dirname}/../Common/helpers`);
const fs = require('fs');
const tableColumns = getTableColumnsAndTypes();
const pluralize = require('pluralize');

class ViewGeneratorCommand extends Command {
  static get signature() {
    return `crud:view
            { table: Table to generate view templates for }
            {--connection=@value: Specify custom DB connection to use }
            `;
  }

  static get description() {
    return 'Generate view templates for a table';
  }

  async handle(args, options) {
    if(options.connection) {
      validateConnection(options.connection);
    }

    let tableName = args.table.toLowerCase();
    let columnsTypes = await tableColumns(tableName, options.connection);
    let singular = pluralize.singular(tableName);
    let plural = pluralize.plural(tableName);
    this.columns = columnsTypes;

    let pascalName = pascalCase(singular);
    let pascalPlural = pluralize.plural(pascalName);

    Promise.all([
      this.copyAndUpdateViews({plural, pascalPlural, pascalName, singular}),
      this.updateRoutes({plural, pascalName, pascalPlural}),
      this.copyAndUpdateStore({singular, plural, pascalName}),
      this.updateStoreImport({singular}),
      this.updateSidebar({singular, pascalPlural, plural})
    ]).then(() => {
      this.info('Done');
      process.exit();
    });

  }

  async copyAndUpdateViews({plural, pascalPlural, pascalName, singular}) {
    this.info('Setting up view file');

    // copy views
    await this.copy(`${__dirname}/../templates/views`, Helpers.viewsPath(`admin/src/pages/${plural}`));

    // update views
    let paths = [
      Helpers.viewsPath(`admin/src/pages/${plural}/Form.vue`),
      Helpers.viewsPath(`admin/src/pages/${plural}/Index.vue`),
      Helpers.viewsPath(`admin/src/pages/${plural}/Layout.vue`)
    ];

    let vm = this;
    let inputFieldsMarker = `<!-- insert input fields here -->`;
    let columnsMarker = `// Insert columns here`;

    for (let path of paths) {
      fs.readFile(path, function (err, data) {
        let columns = vm.generateVueTableColumns();
        let inputFields = vm.generateInputFields();

        data = data.toString()
          .replace(new RegExp('{{pascalName}}', 'g'), pascalName)
          .replace(new RegExp('{{singular}}', 'g'), singular)
          .replace(new RegExp('{{pascalPlural}}', 'g'), pascalPlural)
          .replace(new RegExp('{{snakeCase}}', 'g'), plural);

        if(!data.includes(inputFields)) {
          data = data.replace(inputFieldsMarker, inputFields)
        }

        if(!data.includes(columns)) {
          data = data.replace(columnsMarker, columns);
        }

        fs.writeFile(path, data, function (err) {

        });
      });
    }
  }

  async updateRoutes({pascalName, plural, pascalPlural}) {
    this.info('Setting up routes');

    // update route
    let importMarker = `// Import Model Components Here. Do not remove this line`;
    let routeMarker = `// Import Model Routes Here. Do not remove this line`;
    let routePath = Helpers.viewsPath(`admin/src/router/routes.js`);

    return Promise.resolve(fs.readFile(routePath, function (err, data) {
      let imports = `
// ${pascalPlural}
import ${pascalName} from "@/pages/${plural}/Layout.vue";
import ${pascalName}Index from "@/pages/${plural}/Index.vue";
import ${pascalName}Form from "@/pages/${plural}/Form.vue";
`;

      let routes = `
      {
        path: "${plural}",
        name: "${pascalPlural}",
        redirect: "/${plural}/index",
        components: {default:${pascalName}},
        children: [
          {
            path: "index",
            name: "${pascalPlural} Index",
            component:${pascalName}Index,
          },
          {
            path: "create",
            name: "${pascalPlural} New",
            component:${pascalName}Form,
          },
          {
            path: ":id",
            name: "${pascalPlural} Edit",
            component:${pascalName}Form,
          },
        ]
      },
`;

      data = data.toString();

      if(!data.includes(imports + importMarker)) {
        data = data.replace(importMarker, imports + importMarker);
      }

      if(!data.includes(routes + routeMarker)) {
        data = data.replace(routeMarker, routes + routeMarker);
      }

      fs.writeFile(routePath, data, function (err) {

      });
    }));
  }

  async copyAndUpdateStore({singular, plural, pascalName}) {
    this.info('Setting up vuex store');

    // copy store
    await this.copy(`${__dirname}/../templates/store`, Helpers.viewsPath(`admin/src/store/${singular}`));

    // update store
    let paths = [
      Helpers.viewsPath(`admin/src/store/${singular}/actions.js`),
      Helpers.viewsPath(`admin/src/store/${singular}/getters.js`),
      Helpers.viewsPath(`admin/src/store/${singular}/mutations.js`),
      Helpers.viewsPath(`admin/src/store/${singular}/store.js`)
    ];

    const baseUrl = `${Env.get('APP_URL')}/${Config.get('crudGenerator.admin_prefix')}`;

    for (let path of paths) {
      let data = fs.readFileSync(path, 'utf8');

        data = data.toString()
          .replace(new RegExp(`{{baseUrl}}`, 'g'), baseUrl)
          .replace(new RegExp(`{{plural}}`, 'g'), plural)
          .replace(new RegExp(`{{singular}}`, 'g'), singular)
          .replace(new RegExp(`{{pascalCapital}}`, 'g'), pascalName.toUpperCase());

        fs.writeFileSync(path, data, 'utf8');

    }
  }

  async updateStoreImport({singular}) {
    this.info('Completing store setup');

    // update store import
    let storePath = Helpers.viewsPath(`admin/src/store/index.js`);
    let storeImportMarker = `// Add new store. Don't remove this line`;
    let storeExportMarker = `// export new store. Don't remove this line`;

    Promise.resolve(fs.readFile(storePath, function (err, data) {

      data = data.toString();

      if(!data.includes(`import {${singular}} from './${singular}/store';\n` + storeImportMarker)) {
        data = data.replace(storeImportMarker, `import {${singular}} from './${singular}/store';\n` + storeImportMarker);
      }

      if(!data.includes(`${singular},\n` + storeExportMarker)) {
        data = data.replace(storeExportMarker, `${singular},\n` + storeExportMarker);
      }

      fs.writeFile(storePath, data, function (err) {

      });
    }));
  }

  async updateSidebar({singular, pascalName, plural, pascalPlural}) {
    this.info('Adding links to sidebar');

    // update store import
    let path = Helpers.viewsPath(`admin/src/pages/Dashboard/Layout/DashboardLayout.vue`);
    let marker = `<!-- INSERT NEW ENDPOINTS HERE. DO NOT REMOVE THIS LINE -->`;

    let routeString = `
    <sidebar-item opened :link="{ name: '${pascalPlural}' }">
          <sidebar-item
            :link="{
              name: '${pascalPlural} Index',
              path: '/${plural}/index',
            }"
          />
          <sidebar-item
            :link="{
              name: '${pascalPlural} New',
              path: '/${plural}/create',
            }"
          />
        </sidebar-item>
    `;

    Promise.resolve(fs.readFile(path, function (err, data) {

      data = data.toString();

      if(!data.includes(routeString + marker)) {
        data = data.replace(marker, routeString + marker);
      }

      fs.writeFile(path, data, function (err) {

      });
    }));
  }

  generateInputFields() {
    let columns = this.columns;
    let string = '';

    Object.keys(columns).forEach(columnName => {
      if(!columns[columnName].primary && !['created_at','updated_at'].includes(columnName)) {
        let column = columns[columnName];
        let validationRules = column.nullable ? '' : 'required|';
        let columnType;

        switch (column['type']) {
          case 'string':
            columnType = column.length > 100 ? 'textarea' : 'text';
            validationRules += column.length > 0 ? `|max:${column.length}` : '';
            break;
          case 'number':
            columnType = 'number';
            validationRules += `numeric`;
            validationRules += column.length > 0 ? `|max:${column.length}` : '';
            break;
          case 'datetime':
            columnType = 'datetime';
            break;
          case 'date':
            columnType = 'date';
            break;
          case 'boolean':
            columnType = 'checkbox';
            break;
        }

        // if column name seem like email/password
        if(columnName.includes('email')) {
          columnType = 'email';
          validationRules += `|email`;
        }

        if(columnName.includes('password')) {
          columnType = 'password';
          validationRules += `|min:8`;
        }

        validationRules = validationRules.slice(-1) === '|' ? validationRules.slice(0, -1) : validationRules;
        validationRules = validationRules.charAt(0) === '|' ? validationRules.substring(1) : validationRules;

        string += `
<div class="md-layout-item md-size-100">
    ${columnType  == 'checkbox' ? `` :'<md-field>'}
      <label>${pascalCase(columnName)} </label>

      <md-${
          columnType == 'checkbox' ? 'checkbox'
            : (
              columnType == 'textarea' ? 'textarea'
                : 'input'
            )
        } ${column.length > 0 ? `max="${column.length}"` : ''} name="${columnName}" v-validate="'${validationRules}'" v-model="body.${columnName}" :class="'${columnType}'" type="${columnType}"/>
    ${columnType  == 'checkbox' ? `<hr>` :'</md-field>'}
    <small
      class="form-text text-danger"
      v-show="errors.has('${columnName}')"
    >{{errors.first('${columnName}')}}</small>

  </div>
`;
      }
    });

    return string;
  }

  generateVueTableColumns() {
    let columns = this.columns;
    let string = '';

    Object.keys(columns).forEach(columnName => {
        let column = columns[columnName];
        string += `
{
  name: "${columnName}",
  title: "${pascalCase(columnName)}",
  active: true,
  ${(['number', 'datetime', 'date'].includes(column.type)) ? `sortField: '${columnName}',` : `` }
  ${column.type == 'string' && column.length > 100 ? `
  callback: s => {
    return truncate(s)
  }
 ` : ``}
},
`;
      });

    return string;
  }


}

module.exports = ViewGeneratorCommand;
