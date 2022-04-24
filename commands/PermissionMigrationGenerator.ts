import { BaseCommand, args, flags } from '@adonisjs/core/build/standalone'
import { pascalCase, getTableColumnsAndTypes, validateConnection, resolveModelName } from '../common/helpers'
import fs from 'fs'
import util from 'util'
const execSync = util.promisify(require('child_process').execSync)

export default class PermissionMigrationGenerator extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'crud:permission'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Generate CRUD for a table'

  @args.string({ description: 'Table to generate model and relationships for' })
  public table: string

  @flags.boolean({ description: 'Run new migration' })
  public migrate: boolean

  @flags.boolean({ description: 'Specify custom DB connection to use' })
  public connection: string

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

  public async run() {
    const dbInstance = this.application.container.use('Adonis/Lucid/Database')
    if (this.connection) {
      validateConnection(dbInstance, this.application.config, this.connection)
    }

    const tableColumns = getTableColumnsAndTypes(dbInstance, this.application.config)
    let tableName = this.table.toLowerCase()

    await tableColumns(tableName, this.connection)

    let migrationFile = `${__dirname}/../templates/migration.txt`

    this.logger.info('Add migration file')
    let data = String(fs.readFileSync(migrationFile))
    let migrationPath = this.application.migrationsPath(`admin_permissions_for_${tableName}.ts`)

    let pascalName = pascalCase(tableName)
    let adminUserModelNamespace = this.application.config.get('CrudGenerator.admin_user', 'App/Models/User')
    let userModelName = String(resolveModelName(adminUserModelNamespace))

    data = data
      .replace(new RegExp('{{model}}', 'g'), tableName)
      .replace(new RegExp('{{pascalCase}}', 'g'), pascalName)
      .replace('{{userModel}}', userModelName)
      .replace('{{userModelNamespace}}', adminUserModelNamespace)

    fs.writeFileSync(migrationPath, data)
    if (this.migrate) {
      await this.runMigration()
    }

    process.exit()
  }

  private async runMigration() {
    this.logger.info('Run migration')
    let vm = this

    execSync(`node ace migration:run`, { stdio: 'inherit' }, (_e, stdout, _stderr) => {
      if (!stdout.includes('Database migrated successfully')) {
        return vm.error(`Error: ${stdout}`)
      }

      vm.logger.info('Permission seeding complete')
    })
  }
}

