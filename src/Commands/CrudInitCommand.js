'use strict'

const { Command } = require('@adonisjs/ace')
const Helpers = use('Helpers');
const Config = use('Config');
const Env = use('Env');
const { random } = require(`${__dirname}/../Common/helpers`);
const fs = require('fs');
const util = require('util');
const execSync = util.promisify(require('child_process').execSync);

class CrudInitCommand extends Command {
  static get signature () {
    return `crud:init
    { --prefix=@value : Define a custom admin route prefix  }
    `;
  }

  static get description () {
    return 'Publish admin configs';
  }

  async handle (args, options) {

    let prefix = options.prefix;

    if(prefix && (prefix.length > 20 || prefix.length < 5 || !prefix.match(/^[0-9A-Za-z]+$/))) {
        this.error('Prefix must be an alphanumeric string between 5 and 50 characters.');
        return;
    } else {
      prefix = Config.get('crudGenerator.admin_prefix', random(20));
    }
    this.warn(`Admin route will use prefix: ${prefix}`);

    Promise.all([
      this.copyConfig(prefix),
      this.copyController(),
      this.copyRoute(prefix),
      this.copyViews(),
      this.copyMigration(options.migrate),
      this.copyMiddleware()
      ]).then(() => {
        this.info('Admin Generator done with initialisation. Please run any pending migrations');
    });
  }

  runMigration() {
    this.info('Run migration');
    execSync(`node ace migration:run`, (e, stdout, stderr) => {

    });

  }

  copyRoute(prefix) {
    this.info('Copy Route');
    let routeFile = Helpers.appRoot('start/routes.js');
    let routeData = `
Route.group(() => {
    Route.get('login', 'Admin/ProfileController.showLogin').as('admin.profile.login');
    Route.post('login', 'Admin/ProfileController.login').as('admin.profile.login');
    Route.get('logout', 'Admin/ProfileController.logout').as('admin.profile.logout');
}).prefix('${prefix}').middleware(['requestType']);

Route.group(() => {
  Route.get('profile', 'Admin/ProfileController.show').as('admin.profile');
  Route.patch('profile', 'Admin/ProfileController.updatePassword')
}).prefix('${prefix}').middleware(['requestType', 'auth:jwt', 'is:administrator']);
`;
    fs.readFile(routeFile, function (err, data) {

      let append = "";

      // check if config has been loaded before
      if(!data.includes(routeData)) {
        append += `${routeData}\n`;
      }
      fs.appendFile(routeFile, append, function (err) {

      });
    });
  }

  copyMigration(migrate) {
    this.info('Copy migration');
    let password = random();
    let migrationFile = `${__dirname}/../templates/default/migrations/admin_default_role_permission.js`;
    let vm = this;
    fs.readFile(migrationFile, function (err, data) {

      data = data.toString().replace('{{password}}', `'${password}'`);

      fs.writeFile(Helpers.databasePath(`migrations/admin_default_role_permission.js`), data, function (err) {

        vm.warn(`Password: ${password}`);
        if(migrate) vm.runMigration();
      });
    });
  }

  async copyConfig(prefix) {
    this.info('Copy config');
    let configPath = Helpers.appRoot('config/crudGenerator.js')
    await this.copy(`${__dirname}/../config/index.js`, configPath);

    fs.readFile(configPath, function (err, data) {

      data = data.toString().replace('{{adminPrefix}}', prefix);

      fs.writeFile(configPath, data, function (err) {

      });
    });
  }

  async copyController() {
    this.info('Copy Controller');
    let sourcePath = `${__dirname}/../templates/default/controller/ProfileController.js`;
    let destinationPath = Helpers.appRoot('app/Controllers/Http/Admin/ProfileController.js');
    await this.copy(sourcePath, destinationPath);
  }

  async copyMiddleware() {
    this.info('Copy Middleware');
    let sourcePath = `${__dirname}/../templates/RequestTypeMiddleware.js`;
    let destinationPath = Helpers.appRoot('app/Middleware/RequestTypeMiddleware.js');
    await this.copy(sourcePath, destinationPath);
  }

  async copyViews() {
    this.info('Copy views');
    await this.copy(`${__dirname}/../templates/default/views`, Helpers.viewsPath('admin'));

    const baseUrl = `${Env.get('APP_URL')}/${Config.get('crudGenerator.admin_prefix')}`;
    this.info(`Set vue app base URL: ${baseUrl}`);

    let paths = [
      Helpers.viewsPath('admin/src/main.js'),
      Helpers.viewsPath('admin/src/store/profile/actions.js'),
      ];

    for (let path of paths) {
      fs.readFile(path, function (err, data) {

        data = data.toString().replace('{{baseUrl}}', baseUrl);

        fs.writeFile(path, data, function (err) {

        });
      });
    }
  }
}

module.exports = CrudInitCommand;
