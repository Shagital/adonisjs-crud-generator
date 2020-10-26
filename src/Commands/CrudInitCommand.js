'use strict'

const { Command } = require('@adonisjs/ace')
const Helpers = use('Helpers');
const Config = use('Config');
const Env = use('Env');
const { random } = require(`${__dirname}/../Common/helpers`);
const fs = require('fs')
const util = require('util')
const execSync = util.promisify(require('child_process').execSync)

class CrudInitCommand extends Command {
  static get signature () {
    return `crud:init
    { --prefix=@value : Define a custom admin route prefix  }
    `
  }

  static get description () {
    return 'Publish admin configs'
  }

  async handle (args, options) {

    let prefix = options.prefix;

    if(prefix) {
      if (
        prefix.length > 20
        || prefix.length < 5
        || !prefix.match(/^[0-9A-Za-z]+$/)
      ) {
        this.error('Prefix must be an alphanumeric string between 5 and 50 characters.');
        return;
      }
    } else {
      prefix = Config.get('crudGenerator.admin_prefix', random(20));
    }
    this.warn(`Admin route will use prefix: ${prefix}`)

    this.copyConfig(prefix);
    this.copyController();
    this.copyRoute(prefix);
    this.copyViews();
    this.copyMigration();
    this.copyMiddleware();
  }

  runMigration() {
    this.info('Run migration');
    let vm = this;
    execSync(`node ace migration:run`, (e, stdout, stderr) => {
      console.log(e);
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
`
    fs.readFile(routeFile, function (err, data) {
      if (err) return console.error(err);
      let append = "";
      // check if config has been loaded before
      if(!data.includes(routeData)) {
        append += `${routeData}\n`;
      }
      fs.appendFile(routeFile, append, function (err) {
        if (err) return console.error(err);
      });
    });
  }

  copyMigration() {
    this.info('Copy migration');
    let password = random();
    let migrationFile = `${__dirname}/../templates/default/migrations/admin_default_role_permission.js`;
    let vm = this;
    fs.readFile(migrationFile, function (err, data) {
      if (err) return console.error(err);
      data = data.toString().replace('{{password}}', `'${password}'`);
      fs.writeFile(Helpers.databasePath(`migrations/admin_default_role_permission.js`), data, function (err) {
        if (err) return console.error(err);
        vm.warn(`Password: ${password}`);
        //vm.runMigration();
      });
    });
  }

  async copyConfig(prefix) {
    this.info('Copy config');
    let configPath = Helpers.appRoot('config/crudGenerator.js')
    await this.copy(`${__dirname}/../config/index.js`, configPath);

    fs.readFile(configPath, function (err, data) {
      if (err) return console.error(err);
      data = data.toString().replace('{{adminPrefix}}', prefix);
      fs.writeFile(configPath, data, function (err) {
        if (err) return console.error(err);
      });
    });
  }

  async copyController() {
    this.info('Copy Controller');
    await this.copy(`${__dirname}/../templates/default/controller/ProfileController.js`, Helpers.appRoot('app/Controllers/Http/Admin/ProfileController.js'))
  }

  async copyMiddleware() {
    this.info('Copy Middleware');
    await this.copy(`${__dirname}/../templates/RequestTypeMiddleware.js`, Helpers.appRoot('app/Middleware/RequestTypeMiddleware.js'))
  }

  async copyViews() {
    this.info('Copy views');
    await this.copy(`${__dirname}/../templates/default/views`, Helpers.viewsPath('admin'));

    let baseUrl = `${Env.get('APP_URL')}/${Config.get('crudGenerator.admin_prefix')}`;
    this.info(`Set vue app base URL: ${baseUrl}`);
    let paths = [
    Helpers.viewsPath('admin/src/main.js'),
    Helpers.viewsPath('admin/src/store/profile/actions.js'),
      ];

    for (let path of paths) {
      fs.readFile(path, function (err, data) {
        if (err) return console.error(err);
        data = data.toString().replace('{{baseUrl}}', baseUrl);
        fs.writeFile(path, data, function (err) {
          if (err) return console.error(err);
        });
      });
    }
  }
}

module.exports = CrudInitCommand
