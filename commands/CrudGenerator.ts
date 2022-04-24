import { BaseCommand, args, flags } from '@adonisjs/core/build/standalone'
import { getTableColumnsAndTypes, validateConnection } from '../common/helpers'
import util from 'util'
const execSync = util.promisify(require('child_process').execSync)

export default class CrudGenerator extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'crud:generate'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Generate CRUD for a table'

  @args.string({ description: 'Table to generate CRUD for' })
  public table: string

  @flags.boolean({ description: 'Automatically run newly created migration' })
  public migrate: boolean

  @flags.string({ description: 'Specify custom DB connection to use' })
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

    let tableName = this.table

    // this is just to check if the table exists and fail at this point
    await tableColumns(tableName, this.connection)

    execSync(
      `node ace crud:model ${tableName} ${
        this.connection ? `--connection=${this.connection}` : ``
      }`,
      (_e: any, _stdout: any, _stderr: any) => {}
    )
    execSync(
      `node ace crud:controller ${tableName} ${
        this.connection ? `--connection=${this.connection}` : ``
      }`,
      (_e: any, _stdout: any, _stderr: any) => {}
    )
    execSync(
      `node ace crud:permission ${tableName} ${this.migrate ? '--migrate' : ''} ${
        this.connection ? `--connection=${this.connection}` : ``
      }`,
      (_e: any, _stdout: any, _stderr: any) => {}
    )
    execSync(
      `node ace crud:view ${tableName} ${this.connection ? `--connection=${this.connection}` : ``}`,
      (_e: any, _stdout: any, _stderr: any) => {}
    )

    this.logger.info('Done')
    process.exit()
  }
}
