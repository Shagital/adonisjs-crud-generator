'use strict'

const { Command } = require('@adonisjs/ace');
const Config = use('Config');
const Helpers = use('Helpers');
const {
  pascalCase,
  getTableColumnsAndTypes,
  validateConnection
} = require(`${__dirname}/../Common/helpers`);
const fs = require('fs');
const tableColumns = getTableColumnsAndTypes();
const pluralize = require('pluralize');

class ControllerGeneratorCommand extends Command {
  static get signature () {
    return `crud:controller
            { table: Table to generate controller and route for }
            {--connection=@value: Specify custom DB connection to use }
            `;
  }

  static get description () {
    return 'Generate controller and route for a table'
  }

  async handle (args, options) {
    if(options.connection) {
      await validateConnection(options.connection);
    }

    let tableName = args.table.toLowerCase();
    const columnTypes = await tableColumns(tableName, options.connection);
    let singular = pluralize.singular(tableName);
    let plural = pluralize.plural(tableName);

    let controllerFile = `${__dirname}/../templates/controller.js`;
    let pascalName = pascalCase(singular);
    let vm = this;

    fs.readFile(controllerFile, async function (err, data) {

      let controllerPath = Helpers.appRoot(`app/Controllers/Http/Admin/${pascalName}Controller.js`);
      data = await vm.generateString(data, {columnTypes, singular, tableName, pascalName});

      fs.writeFile(controllerPath, data, function () {

        // update application route file with new routes
        vm.info('Add routes');
        vm.addRoutes({singular, plural, tableName, pascalName});
      });
    });

  }

  async generateString(data, {columnTypes, singular, tableName, pascalName}) {
    this.info('Generate controller data');
    let columns = Object.keys(columnTypes);
    let filteredColumns = [];

    // get all columns except primary
    Object.keys(columnTypes).forEach(columnName => {
      if(!columnTypes[columnName].primary) {
        filteredColumns.push(columnName);
      }
    });

    let filters = '';
    let rules = '';

    Object.keys(columnTypes).forEach(columnName => {
      let isPrimary = columnTypes[columnName]['primary'];
      let columnRule = `${columnName}:`;
      let column = columnTypes[columnName];
      let filterValue = `qs.${columnName}`;

      columnRule += `"${column.nullable ? `` : `required|`}`;
      switch (column['type']) {
        case 'string':
          columnRule += `string${column.length > 0 ? `|max:${column.length}` : ``}`;

          if (columnName !== 'password') {
            filters += `
    if(${filterValue}) {
    query.where('${columnName}', 'LIKE', "%"+${filterValue}+"%")
    }
        `;
          }
          break;
        case 'number':
          columnRule += `number${column.length > 0 ? `|max:${column.length}` : ''}`;
          filters += `
    if(${filterValue}) {
      query.where('${columnName}', ${filterValue})
    }
        `;
          break;
        case 'datetime':
          columnRule += `date`;
          filters += `
    if(${filterValue}_from) {
      query.where('${columnName}', '>=', moment(${filterValue}).format('YYYY-MM-DD HH:mm:ss'));
    }
    if(${filterValue}_to) {
      query.where('${columnName}', '<=', moment(${filterValue}).format('YYYY-MM-DD HH:mm:ss'));
    }
        `;
          break;
        case 'date':
          columnRule += `date`;
          filters += `
    if(${filterValue}_from) {
      query.where('${columnName}', '>=', moment(${filterValue}).format('YYYY-MM-DD'));
    }

    if(${filterValue}_to) {
      query.where('${columnName}', '<=', moment(${filterValue}).format('YYYY-MM-DD'));
    }
       `;
          break;
        case 'boolean':
          columnRule += `boolean`;
          filters += `
    if(${filterValue}) {
      query.where('${columnName}', !!${filterValue});
    }
       `;
          break;
      }

      columnRule += `${column.unique ? `|unique:${tableName},${columnName},id,"+params.id+"` : ''}`;

      // if column name seem like email/password
      columnRule += `${columnName.includes('email') ? `|email` : ''}`;
      columnRule += `${columnName.includes('password') ? `|min:8` : ''}`;
      columnRule = columnRule.slice(-1) === '|' ? columnRule.slice(0, -1) : columnRule;
      rules += (!isPrimary && !['created_at', 'updated_at', 'deleted_at'].includes(columnName)) ? `      ${columnRule}",\n` : '';
    });


    data = data.toString()
      .replace(new RegExp('{{singularName}}', 'g'), singular)
      .replace(new RegExp('{{pluralName}}', 'g'), tableName)
      .replace(new RegExp('{{pascalName}}', 'g'), pascalName)
      .replace(new RegExp('{{tableColumns}}', 'g'), `['${columns.join("','")}']`)
      .replace(new RegExp('{{filteredColumns}}', 'g'), `['${filteredColumns.join("','")}']`)
      .replace(new RegExp('{{filters}}', 'g'), filters)
      .replace(new RegExp('{{rulesArray}}', 'g'), rules);

    return data;

  }

  async addRoutes({plural, pascalName}) {
    let adminPrefix = Config.get('crudGenerator.admin_prefix');
    let string = `
Route.group(() => {
  Route.resource('${plural}', 'Admin/${pascalName}Controller');
}).prefix('${adminPrefix}').middleware(['requestType', 'auth:jwt', 'is:administrator']);
`;

    let routeFile = Helpers.appRoot(`start/routes.js`)
    fs.readFile(routeFile, async function (err, data) {

      if(!data.includes(string)) {
        data += `${string}\n`;
      }

      fs.writeFile(routeFile, data, function (err) {
        process.exit();
      });
    });
  }
}

module.exports = ControllerGeneratorCommand;
