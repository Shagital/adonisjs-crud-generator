'use strict'
const { Command } = require('@adonisjs/ace');
const {getTableColumnsAndTypes, validateConnection} = require(`${__dirname}/../Common/helpers`);
const {execSync} = require('child_process');

let tableColumns = getTableColumnsAndTypes();

class CrudGeneratorCommand extends Command {
  static get signature () {
    return `crud:generate
            { table: Table to generate CRUD for }
            {--migrate: Automatically run newly created migration }
            {--connection=@value: Specify custom DB connection to use}
            `;
  }

  static get description () {
    return 'Generate CRUD for a table';
  }

  async handle (args, options) {
    if(options.connection) {
      validateConnection(options.connection);
    }

    let tableName = args.table;

    // this is just to check if the table exists and fail at this point
    let columns = await tableColumns(tableName, options.connection);

    execSync(`node ace crud:model ${tableName} ${options.connection ? `--connection=${options.connection}` : ``}`, (e, stdout, stderr) => {

    });
    execSync(`node ace crud:controller ${tableName} ${options.connection ? `--connection=${options.connection}` : ``}`, (e, stdout, stderr) => {

    });
    execSync(`node ace crud:permission ${tableName} ${options.migrate ? '--migrate' : ''} ${options.connection ? `--connection=${options.connection}` : ``}`, (e, stdout, stderr) => {

    });
    execSync(`node ace crud:view ${tableName} ${options.connection ? `--connection=${options.connection}` : ``}`, (e, stdout, stderr) => {

    });

    this.info('Done');
    process.exit();
  }
}

module.exports = CrudGeneratorCommand;
