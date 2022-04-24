import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import { random, resolveUrl, validEmail, replaceAll, resolveModelName } from '../common/helpers'
import fs from 'fs-extra'
import util from 'util'
const execSync = util.promisify(require('child_process').execSync)

export default class CrudInit extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'crud:init'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Publish admin configs'

  @flags.string({ description: 'Define a custom admin route prefix' })
  public prefix: string

  @flags.boolean({ description: 'Automatically run newly created migration' })
  public migrate: boolean

  @flags.boolean({ description: 'Force run command in production' })
  public force: boolean

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

    if (this.application.inProduction && !this.force) {
      const confirmAction = await this.prompt.confirm('Run command in production?')
      if (!confirmAction) {
        return
      }
    }
    let prefix = this.prefix || this.application.config.get('crudGenerator.admin_prefix')

    if (prefix && (prefix.length > 20 || prefix.length < 5 || !prefix.match(/^[0-9A-Za-z]+$/))) {
      this.logger.error('Prefix must be an alphanumeric string between 5 and 50 characters.')
      return
    } else if (!prefix) {
      prefix = this.application.config.get('crudGenerator.admin_prefix', random(20))
    }
    this.logger.debug(`Admin route will use prefix: ${prefix}`)

    if (!this.initializeDirectories()) {
      return
    }

    Promise.all([
      this.copyConfig(prefix),
      this.copyController(),
      this.copyRoute(prefix),
      this.copyViews(prefix),
      this.copyMigration(this.migrate),
      this.createEnv(prefix),
    ]).then(() => {
      this.logger.info(
        'Admin Generator done with initialisation. Please run any pending migrations'
      )
    })
  }

  private initializeDirectories(): boolean {
    // first make sure appropriate folders exist, if not create
    let adminAppPath = this.application.viewsPath('admin')
    let configPath = this.application.configPath()
    let migrationPath = this.application.migrationsPath()
    let startPath = this.application.startPath()
    let controllerPath = `${this.application.appRoot}/app/Controllers/Http/Admin`
    let modelPath = `${this.application.appRoot}/app/Models`
    let middlewarePath = `${this.application.appRoot}/app/Middleware`

    try {
      if (!fs.existsSync(adminAppPath)) {
        fs.mkdirSync(adminAppPath, { recursive: true })
      }
      if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true })
      }
      if (!fs.existsSync(migrationPath)) {
        fs.mkdirSync(migrationPath, { recursive: true })
      }
      if (!fs.existsSync(startPath)) {
        fs.mkdirSync(startPath, { recursive: true })
      }
      if (!fs.existsSync(controllerPath)) {
        fs.mkdirSync(controllerPath, { recursive: true })
      }
      if (!fs.existsSync(modelPath)) {
        fs.mkdirSync(modelPath, { recursive: true })
      }
      if (!fs.existsSync(middlewarePath)) {
        fs.mkdirSync(middlewarePath, { recursive: true })
      }
      return true
    } catch (e) {
      this.logger.error(`Error occured while trying to create required directories: ${e.message}`)
      return false
    }
  }

  private runMigration() {
    this.logger.info('Run migration')
    execSync(`node ace migration:run`, (_e) => {})
  }

  private createEnv(prefix) {
    this.logger.info('Creating sample env files')

    const baseUrl = `${this.Env.get(
      'APP_URL',
      `http://${this.Env.get('HOST')}:${this.Env.get('PORT')}`
    )}/${prefix}`
    this.logger.info(`Set vue app base URL: ${baseUrl}`)
    let envPath = this.application.viewsPath('admin/.env')
    this.logger.debug(`Env Path: ${envPath}`)
    let envExamplePath = this.application.viewsPath('admin/.env.example')
    this.logger.debug(`Example Env Path: ${envExamplePath}`)

    let data = `NODE_ENV=development
VUE_APP_BASE_URI=
VUE_APP_NAME=
VUE_APP_I18N_LOCALE=en
VUE_APP_I18N_FALLBACK_LOCALE=en
      `
    fs.appendFileSync(envExamplePath, data)

    data = `NODE_ENV=development
VUE_APP_BASE_URI=${baseUrl}
VUE_APP_NAME=${this.Env.get('APP_NAME')}
VUE_APP_I18N_LOCALE=en
VUE_APP_I18N_FALLBACK_LOCALE=en
      `

    fs.appendFileSync(envPath, data)
  }

  private copyRoute(prefix: string) {
    this.logger.info('Copy Route')
    let routeFile = this.application.startPath(`routes.ts`)
    let routeData = `
Route.group(() => {
  Route.post('login', 'Admin/ProfilesController.login').as('admin.profile.login')
}).prefix('${prefix}/auth')
Route.group(() => {
  Route.get('me', 'Admin/ProfilesController.show').as('admin.profile')
  Route.get('logout', 'Admin/ProfilesController.logout').as('admin.profile.logout')
  Route.patch('refresh', 'Admin/ProfilesController.refresh').as('admin.profile.refresh')
  Route.patch('update', 'Admin/ProfilesController.updateProfile').as('admin.profile.update')
})
  .prefix('${prefix}/auth')
  .middleware(['auth:api', 'is:administrator'])`
    let data = String(fs.readFileSync(routeFile))
    let append = ''

    // check if routes have been appended before
    if (!data.includes(routeData)) {
      append += `${routeData}\n`
    }
    fs.appendFileSync(routeFile, append)
  }

  private copyMigration(migrate: boolean) {
    this.logger.info('Copy migration')
    let password = random()
    let migrationFile = `${__dirname}/../templates/default/migrations/admin_default_role_permission.txt`
    let destinationFile = this.application.migrationsPath(`admin_default_role_permission.ts`)

    let data = String(fs.readFileSync(migrationFile))
    if (fs.existsSync(destinationFile)) {
      this.logger.debug(`Migration ${destinationFile} already exists. Won't be modified.`)
      return
    }

    let adminUserModelNamespace = this.application.config.get('CrudGenerator.admin_user', 'App/Models/User')
    let modelName = String(resolveModelName(adminUserModelNamespace))
    data = data
      .replace('{{password}}', `'${password}'`)
      .replace('{{modelNamespace}}', adminUserModelNamespace)
      .replace('{{userModel}}', modelName)
      .replace('{{userModelNamespace}}', adminUserModelNamespace)

    data = replaceAll(data, '{{model}}', modelName)

    fs.writeFileSync(destinationFile, data)
    this.logger.debug(`Password: ${password}`)
    if (migrate) this.runMigration()
  }

  private copyConfig(prefix: string) {
    this.logger.info('Copy config')
    let configPath = this.application.configPath(`crudGenerator.ts`)
    fs.copyFileSync(`${__dirname}/../config/crudGenerator.txt`, configPath)

    let data = String(fs.readFileSync(configPath))
    let host = resolveUrl(this.Env.get('APP_URL', this.Env.get('HOST')), 'host')
    let adminEmail =
      host && validEmail(`admin@${host}`) ? `admin@${host}` : 'administrator@webmail.com'
    data = data.replace('{{adminPrefix}}', prefix).replace('{{adminEmail}}', adminEmail)

    fs.writeFileSync(configPath, data)
  }

  private copyController() {
    this.logger.info('Copy Controller')
    let sourcePath = `${__dirname}/../templates/default/controller/ProfilesController.txt`
    let destinationPath = `${this.application.appRoot}/app/Controllers/Http/Admin/ProfilesController.ts`

    let data = String(fs.readFileSync(sourcePath))
    let adminUserModelNamespace = this.application.config.get('CrudGenerator.admin_user', 'App/Models/User')
    let modelName = adminUserModelNamespace.split('/').pop()
    data = data.replace('{{modelNamespace}}', adminUserModelNamespace)
    data = replaceAll(data, '{{model}}', modelName)

    fs.writeFileSync(destinationPath, data)
  }

  private async copyViews(prefix: string) {
    this.logger.info('Copy views')
    fs.copySync(`${__dirname}/../templates/default/views`, this.application.viewsPath('admin'))

    const baseUrl = `${this.Env.get('APP_URL', `${this.Env.get('HOST')}:${this.Env.get('PORT')}`)}/${prefix}`
    this.logger.info(`Set Vue app API baseURL: ${baseUrl}`)

    let paths = [
      this.application.viewsPath('admin/src/main.js'),
      this.application.viewsPath('admin/src/store/global/actions.js'),
    ]

    for (let path of paths) {
      let data = String(fs.readFileSync(path))
      data = data.replace('{{baseUrl}}', baseUrl).replace('{{appName}}', this.Env.get('APP_NAME'))

      fs.writeFileSync(path, data)
    }
  }
}

