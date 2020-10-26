'use strict'

const { Command } = require('@adonisjs/ace');
const Helpers = use('Helpers');
const {pascalCase, camelCase, getTableColumnsAndTypes, validateConnection} = require(`${__dirname}/../Common/helpers`);
const fs = require('fs')
const util = require('util')
const execSync = util.promisify(require('child_process').execSync);
const tableColumns = getTableColumnsAndTypes();
const pluralize = require('pluralize');

class ModelGeneratorCommand extends Command {
  static get signature () {
    return `crud:model
            { table: Table to generate model and relationships for }
            {--connection=@value: Specify custom DB connection to use }
            `
  }

  static get description () {
    return 'Generate model and relationships for a table'
  }

  async handle (args, options) {
    if(options.connection) {
      validateConnection(options.connection);
    }

    let tableName = args.table.toLowerCase();
    let columnsTypes = await tableColumns(tableName, options.connection);

    let singular = pluralize.singular(tableName);
    let modelFile = `${__dirname}/../templates/model.js`;
    let pascalName = pascalCase(singular);
    let vm = this;

    fs.readFile(modelFile, async function (err, data) {
      data = await vm.generateString(data, {columnsTypes:columnsTypes,singular:singular,tableName:tableName, pascalName: pascalName});

      fs.writeFile(Helpers.appRoot(`app/Models/${pascalName}.js`), data, function (err) {
        process.exit();
      });
    });

  }

  async generateString(data, {columnsTypes, singular, tableName, pascalName}) {
    this.info('Generate model data');

    let columns = Object.keys(columnsTypes);

    let primary = {};
    let dates = [];
    let dateCast = '';
    let dateFormat = '';
    let relationships = '';
    let hooks = '';
    let hash = '';
    let relationshipArray = [];
    let hidden = [];

    Object.keys(columnsTypes).forEach(columnName => {
      let column = columnsTypes[columnName];

      if(column['primary']) {
        primary = column;
        primary['name'] = columnName;
      } else if (columnName == 'password') {
        hidden.push(columnName);
        hash = `const Hash = use('Hash')`;
        hooks += `
    this.addHook('beforeCreate', async (modelInstance) => {
      modelInstance.password = await Hash.make(modelInstance.password)
    });
 `
      }
      else if(
        ['timestamp', 'datetime', 'date'].includes(column['type'])
      ) {
        dates.push(columnName);

        if(['timestamp', 'datetime'].includes(column['type'])) {
          dateCast += `
    if (field === '${columnName}') {
      return value.format('LLL')
    }
`
          dateFormat += `
     if (field === '${columnName}') {
        return value.getFullYear() + "-" + (value.getMonth() + 1) + "-" + value.getDate() + " " +
            value.getHours() + ":" + value.getMinutes() + ":" + value.getSeconds()
     }
`
        } else {
          dateCast += `
    if (field === '${columnName}') {
      return value.format('LL')
     }
`
          dateFormat += `
    if (field === '${columnName}') {
      return value.getFullYear() + "-" + (value.getMonth() + 1) + "-" + value.getDate()
    }
`
        }
      }
      else if(
        column['primary_table']
        && column['primary_column']
        && column['relation_name']
      ) {
        let pascal = pascalCase(pluralize.singular(column['primary_table']));
        let camel = camelCase(pluralize.singular(column['relation_name']));
        relationshipArray.push(camel);
        relationships += `
  ${camel}() {
     return this.belongsTo("App/Models/${pascal}", "${column['primary_column']}", "${columnName}");
  }
`
      }
    });

    data = data.toString()
      .replace(new RegExp('{{pascalName}}', 'g'), pascalName)
      .replace(new RegExp('{{tableName}}', 'g'), tableName)
      .replace('{{createdAt}}', columns.find(s => s == 'created_at') ? "'created_at'" : null)
      .replace('{{updatedAt}}', columns.find(s => s == 'updated_at') ? "'updated_at'" : null)
      .replace('{{primaryColumn}}', primary ? primary['name'] : null)
      .replace('{{autoIncrement}}', primary ? !!primary['autoincrement'] : false)
      .replace('{{dates}}', dates.length ? `[\n   '${dates.join("',\n    '")}'\n]` : '[]')
      .replace('{{dateFormat}}', dateFormat)
      .replace('{{dateCast}}', dateCast)
      .replace('{{relationships}}', relationships)
      .replace('{{relationshipArray}}', relationshipArray.length ? `['${relationshipArray.join("','")}']` : '[]')
      .replace('{{hiddenColumns}}', hidden.length ? `[\n    '${hidden.join(`',\n    '`)}'\n]` : '[]')
      .replace('{{hooks}}', hooks)
      .replace('{{hash}}', hash)

    return data;

  }

}

module.exports = ModelGeneratorCommand
