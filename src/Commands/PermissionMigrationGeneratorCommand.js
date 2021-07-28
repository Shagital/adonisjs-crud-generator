'use strict'

const { Command } = require('@adonisjs/ace');
const Helpers = use('Helpers');
const {
  pascalCase,
  getTableColumnsAndTypes,
  validateConnection
} = require(`${__dirname}/../Common/helpers`);
const fs = require('fs');
const util = require('util');
const execSync = util.promisify(require('child_process').execSync);
const tableColumns = getTableColumnsAndTypes();

class PermissionMigrationGeneratorCommand extends Command {
  static get signature () {
    return `crud:permission
            { table: Table to generate permission migration for }
            { --migrate: Run new migration }
            { --connection=@value: Specify custom DB connection to use }
            `;
  }

  static get description () {
    return 'Generate CRUD for a table';
  }

  async handle (args, options) {
    if(options.connection) {
      validateConnection(options.connection);
    }

    let tableName = args.table.toLowerCase();

    await tableColumns(tableName, options.connection);

    let migrationFile = `${__dirname}/../templates/migration.js`;
    let vm = this;

    this.info('Add migration file');
    fs.readFile(migrationFile, function (err, data) {

      let migrationPath = Helpers.databasePath(`migrations/admin_permissions_for_${tableName}.js`);

      data = data.toString()
        .replace(new RegExp('{{model}}', 'g'), tableName)
        .replace(new RegExp('{{pascalCase}}', 'g'), pascalCase(tableName));

      fs.writeFile(migrationPath, data, async function (err) {

        if(options.migrate) {
          await vm.runMigration();
        }

        process.exit();
      });
    });

  }

  async runMigration() {
    this.info('Run migration');
    let vm = this;

    execSync(`node ace migration:run`, {stdio: 'inherit'}, (e, stdout, stderr) => {
      if (!stdout.includes('Database migrated successfully')) {
        return vm.error(`Error: ${stdout}`);
      }

      vm.info('Permission seeding complete');
    });

  }
}

module.exports = PermissionMigrationGeneratorCommand;
