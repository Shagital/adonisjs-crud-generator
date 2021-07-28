'use strict'

const {Command} = require('@adonisjs/ace');
const { json } = require('express');
const Config = use('Config');
const Env = use('Env');
const Helpers = use('Helpers');
const {
  pascalCase,
  getTableColumnsAndTypes,
  validateConnection,
  snakeCase: toSnakeCase,
  titleCase,
} = require(`${__dirname}/../Common/helpers`);
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
    let snakeCase = toSnakeCase(tableName);
    this.columns = columnsTypes;

    let pascalName = pascalCase(singular);
    let pascalPlural = pluralize.plural(pascalName);

    Promise.all([
      this.copyAndUpdateViews({plural, pascalPlural, pascalName, singular, snakeCase}),
      this.updateRoutes({plural, pascalName, pascalPlural}),
      this.copyAndUpdateStore({singular, plural, pascalName}),
      this.updateStoreImport({singular}),
      this.updateSidebar({singular, pascalPlural, plural}),
      this.updateTranslations({snakeCase, pascalName, pascalPlural})
    ]).then(() => {
      this.info('Done');
      process.exit();
    });

  }

  async copyAndUpdateViews({plural, pascalPlural, pascalName, singular, snakeCase}) {
    this.info('Setting up view file');

    // copy views
    await this.copy(`${__dirname}/../templates/views`, Helpers.viewsPath(`admin/src/views/${pascalPlural}`));

    // update views
    let paths = [
      Helpers.viewsPath(`admin/src/views/${pascalPlural}/Layout.vue`),
      Helpers.viewsPath(`admin/src/views/${pascalPlural}/Form.vue`),
      Helpers.viewsPath(`admin/src/views/${pascalPlural}/Index.vue`),
      Helpers.viewsPath(`admin/src/views/${pascalPlural}/Filter.vue`)
    ];

    let inputFieldsMarker = ` <!-- insert input fields here. Do not remove -->`;
    let columnsMarker = `// Insert columns here. Do not remove`;

    let queue = []
    for (let path of paths) {

      queue.push(this.updateView({path, columnsMarker, inputFieldsMarker, pascalName, singular, plural, pascalPlural, snakeCase}));

    }

    let result = await Promise.all(queue);
    return result;

  }

  async updateView({path, columnsMarker, inputFieldsMarker, pascalName, singular, plural, pascalPlural, snakeCase}) {

    let data = fs.readFileSync(path);

    let columns = this.generateVueTableColumns(snakeCase);
    let inputFields = this.generateInputFields(snakeCase);

    data = data.toString()
      .replace(new RegExp('{{pascalName}}', 'g'), pascalName)
      .replace(new RegExp('{{singular}}', 'g'), singular)
      .replace(new RegExp('{{pascalPlural}}', 'g'), pascalPlural)
      .replace(new RegExp('{{snakeCase}}', 'g'), snakeCase);

    if(!data.includes(inputFields)) {

      data = data.replace(inputFieldsMarker, inputFields)
    }

    if(!data.includes(columns)) {

      data = data.replace(columnsMarker, columns);
    }

    return fs.writeFileSync(path, data);
  }

  async updateRoutes({pascalName, plural, pascalPlural}) {
    this.info('Setting up routes');

    // update route
    let importMarker = `// Import Model Components Here. Do not remove this line`;
    let routeMarker = `// Import Model Routes Here. Do not remove this line`;
    let routePath = Helpers.viewsPath(`admin/src/router/index.js`);

    return Promise.resolve(fs.readFile(routePath, function (err, data) {
      let imports = `
// ${pascalPlural}
import ${pascalName} from "@/views/${pascalPlural}/Layout.vue";
import ${pascalName}Index from "@/views/${pascalPlural}/Index.vue";
import ${pascalName}Form from "@/views/${pascalPlural}/Form.vue";
`;

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

  async updateTranslations({snakeCase, pascalName, pascalPlural}) {
    this.info('Updating translations');

    // update store import
    let translationPath = Helpers.viewsPath(`admin/src/locales/en.json`);

    let vm = this;
    Promise.resolve(fs.readFile(translationPath, function (err, data) {

      data = JSON.parse(data);

      let jsonData = {
        "name" : pascalName,
        "title" : pascalName,
        "plural" : pascalPlural,
        "column" : {

        }
      }

      let column = {};
      Object.keys(vm.columns).forEach(columnName => {
        column[toSnakeCase(columnName)] = titleCase(columnName);
      })

      jsonData.column = column;

      if(!data[snakeCase]) {
        data[snakeCase] = jsonData
      } else {
        let existingColumns = data[snakeCase].column || {};
        jsonData.column = {...existingColumns, ...jsonData.column};
        data[snakeCase] = {...data[snakeCase], ...jsonData};
      }

      data = JSON.stringify(data);


      fs.writeFile(translationPath, data, function (err) {

      });
    }));
  }

  async updateSidebar({singular, pascalName, plural, pascalPlural}) {
    this.info('Adding links to sidebar');

    // update store import
    let path = Helpers.viewsPath(`admin/src/components/Sidebar.vue`);
    let marker = `<!-- INSERT NEW ENDPOINTS HERE. DO NOT REMOVE THIS LINE -->`;

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

    Promise.resolve(fs.readFile(path, function (err, data) {

      data = data.toString();

      if(!data.includes(routeString + marker)) {
        data = data.replace(marker, routeString + marker);
      }

      fs.writeFile(path, data, function (err) {

      });
    }));
  }

  generateInputFields(snakeCase) {
    let columns = this.columns;
    let string = '';

    Object.keys(columns).forEach(columnName => {
      if(!columns[columnName].primary && !['created_at','updated_at', 'deleted_at'].includes(columnName)) {
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
            validationRules += `decimal`;
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
          default:
            columnType = 'text';
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
<div >
      <label class="text-gray-700" for="${columnName}"><b>{{$t('${snakeCase}.column.${columnName}')}}</b> </label>

      <${columnType == 'textarea' ? 'textarea' : 'input'} ${column.length > 0 ? `max="${column.length}" step="any"` : ''} name="${columnName}" v-validate="'${validationRules}'" v-model="body.${columnName}" :class="'form-input w-full mt-2 rounded-md focus:border-indigo-600'" type="${columnType}">
    ${columnType  == 'checkbox' ? `<hr>` : (columnType == 'textarea' ? '</textarea>' : '')}
    <small
    class="text-red-800"
      v-show="errors.has('${columnName}')"
    >{{errors.first('${columnName}')}}</small>

  </div>
`;
      }
    });
    return string;
  }

  generateVueTableColumns(snakeCase) {
    let columns = this.columns;
    let string = '';

    Object.keys(columns).forEach(columnName => {
        let column = columns[columnName];

        string += `
{
  name: "${columnName}",
  title: () => { return this.$t('${snakeCase}.column.${toSnakeCase(columnName)}')},
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
