import fs from 'fs-extra'
import url from 'url'
import { IConnectionObj, IColumn, IForeignKey, IIndex } from '../types'
const supportedTypes = ['mysql', 'sqlite3', 'pg']

export const getTableColumnsAndTypes = (dbInstance, Config) => {
  let cache = {}
  return async (tableName: string, dbConnection: string | null = null): Promise<Array<IColumn>> => {
    if (cache[tableName]) {
      return Promise.resolve(cache[tableName])
    } else {
      let connectionString = dbConnection || Config.get(`database.connection`)
      let connectionObj: IConnectionObj = Config.get(`database.connections.${connectionString}`)

      const conn = dbInstance.connection(connectionString)

      let columns: IColumn[] = []
      switch (connectionObj.client) {
        case 'mysql':
          columns = await mysqlColumns(conn, tableName, connectionObj.connection.database)
          break
        case 'pg':
          columns = await pgsqlColumns(conn, tableName)
          break
        case 'sqlite3':
          columns = await sqliteColumns(conn, tableName)
          break
        default:
          exitInColors(`Unsupported DB connection [${connectionString}]`)
          break
      }

      if (Object.keys(columns).length < 1) {
        exitInColors(`Table [${tableName}] not found`)
      }
      cache[tableName] = columns
      return columns
    }
  }
}

export async function mysqlColumns(conn, tableName: string, dbName: string): Promise<Array<IColumn>> {
  let columns: Array<IColumn> = []
  let queryResult = await conn.rawQuery(`
      select col.*,
      case when kcu.referenced_table_schema is null then null else '>-' end as rel,
      concat(kcu.referenced_table_schema, '.', kcu.referenced_table_name) as primary_table,
      kcu.referenced_column_name as pk_column_name, kcu.constraint_name as fk_constraint_name
      from information_schema.columns col
      join information_schema.tables tab on col.table_schema = tab.table_schema and col.table_name = tab.table_name
      left join information_schema.key_column_usage kcu on col.table_schema = kcu.table_schema
      and col.table_name = kcu.table_name and col.column_name = kcu.column_name
      and kcu.referenced_table_schema is not null where tab.table_type = 'BASE TABLE'
      and col.table_name = '${tableName}' and col.table_schema = '${dbName}'
      order by col.table_schema, col.table_name, col.ordinal_position
      `)

  Object.keys(queryResult[0]).forEach((key) => {
    let s = queryResult[0][key]

    let primaryTable = (s.primary_table || '').split('.')[1] || null
    let primaryColumn = s.pk_column_name
    let relationName = (s.fk_constraint_name || '')
      .replace(tableName, '')
      .replace('foreign', '')
      .replace('id', '')
    columns[s.COLUMN_NAME] = {
      type: ['timestamp', 'datetime'].includes(s.DATA_TYPE)
        ? 'datetime'
        : ['date'].includes(s.DATA_TYPE)
        ? 'date'
        : ['varchar', 'text', 'enum'].includes(s.DATA_TYPE)
        ? 'string'
        : s.DATA_TYPE === 'boolean' || s.COLUMN_TYPE === 'tinyint(1)'
        ? 'boolean'
        : s.DATA_TYPE.includes('int') || ['decimal'].includes(s.DATA_TYPE)
        ? 'number'
        : 'others',
      unique: ['UNI', 'PRI'].includes(s.COLUMN_KEY),
      primary: s.COLUMN_KEY === 'PRI',
      nullable: s.IS_NULLABLE === 'YES',
      length: s.CHARACTER_MAXIMUM_LENGTH,
      autoincrement: s.EXTRA === 'auto_increment',
      primary_table: primaryTable,
      primary_column: primaryColumn,
      relation_name: relationName,
      original_type: s.DATA_TYPE,
    }
  })

  return columns
}

export async function pgsqlColumns(conn, tableName: string): Promise<Array<IColumn>> {
  let columns: Array<IColumn> = []

  let tableColumnsQuery = await conn.rawQuery(`
SELECT * FROM information_schema.columns WHERE table_name = '${tableName}';
`)

  let tableColumns = tableColumnsQuery.rows

  let indexQuery = await conn.rawQuery(`
 select
    t.relname as table_name,
    i.relname as index_name,
    array_to_string(array_agg(a.attname), ', ') as column_names
from
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
where
    t.oid = ix.indrelid
    and i.oid = ix.indexrelid
    and a.attrelid = t.oid
    and a.attnum = ANY(ix.indkey)
    and t.relkind = 'r'
    and t.relname like '${tableName}%'
group by
    t.relname,
    i.relname
order by
    t.relname,
    i.relname;
      `)

  let indexes = indexQuery.rows

  let foreignKeysQuery = await conn.rawQuery(`
      SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='${tableName}';
      `)

  indexes = indexes.concat(foreignKeysQuery.rows)

  Object.keys(tableColumns).forEach((key) => {
    let tableColumn = tableColumns[key]
    let columnName = tableColumn.column_name
    let columnType = tableColumn.data_type.split(' ')[0]
    let foreign = foreignKeysQuery.rows.find((s) => s.column_name === columnName)

    columns[columnName] = {
      type: ['timestamp', 'datetime'].includes(columnType)
        ? 'datetime'
        : ['date'].includes(columnType)
        ? 'date'
        : ['varchar', 'text', 'character'].includes(columnType)
        ? 'string'
        : columnType.includes('int') || ['decimal', 'enum'].includes(columnType)
        ? 'number'
        : columnType === 'boolean'
        ? 'boolean'
        : 'others',
      unique: !!indexes.find(
        (s) =>
          s.column_names === columnName &&
          s.index_name &&
          s.index_name.split('_').slice(-1)[0] === 'unique'
      ),
      primary: !!indexes.find(
        (s) =>
          s.column_names === columnName &&
          s.index_name &&
          s.index_name.split('_').slice(-1)[0] === 'pkey'
      ),
      nullable: tableColumn.is_nullable === 'YES',
      length: tableColumn.numeric_precision || tableColumn.character_maximum_length,
      autoincrement:
        tableColumn.column_default &&
        tableColumn.column_default.includes(
          `${tableColumn.table_name}_${tableColumn.column_name}_seq`
        ),
      primary_table: foreign ? foreign.foreign_table_name : null,
      primary_column: foreign ? foreign.foreign_column_name : null,
      relation_name: foreign
        ? foreign.constraint_name.replace(tableName, '').replace('foreign', '').replace('id', '')
        : null,
      original_type: columnType,
    }
  })

  return columns
}

export async function sqliteColumns(conn, tableName: string): Promise<Array<IColumn>> {
  let columns: Array<IColumn> = []
  let queryResult = await conn.rawQuery(`PRAGMA table_info('${tableName}');`)
  let foreignKeys: Array<IForeignKey> = await conn.rawQuery(
    `PRAGMA foreign_key_list('${tableName}');`
  )
  let indexes: Array<IIndex> = await conn.rawQuery(`PRAGMA index_list('${tableName}');`)

  for (let i in indexes) {
    indexes[i].indexes = await conn.rawQuery(`PRAGMA index_info('${indexes[i].name}');`)
  }

  let pkCheck = await conn.rawQuery(
    `SELECT COUNT(*) as pk FROM sqlite_sequence WHERE name='${tableName}';`
  )

  Object.keys(queryResult).forEach((key) => {
    let tableColumn = queryResult[key]
    let columnName = tableColumn['name']
    let splitColumn = tableColumn['type'].split('(')
    let columnType = splitColumn[0]
    let length = splitColumn[1] ? splitColumn[1].split(')')[0] : null

    let foreignCol: IForeignKey | undefined = foreignKeys.find((s) => s.from === columnName)
    let index: IIndex | undefined = indexes.find(
      (s) => !!s.indexes.find((b) => b.name === columnName)
    )

    columns[columnName] = {
      type: ['timestamp', 'datetime'].includes(columnType)
        ? 'datetime'
        : ['date'].includes(columnType)
        ? 'date'
        : ['varchar', 'text'].includes(columnType)
        ? 'string'
        : columnType.includes('int') || ['decimal', 'enum'].includes(columnType)
        ? 'number'
        : columnType === 'boolean'
        ? 'boolean'
        : 'others',
      unique: !!(index && index.unique === 1),
      primary: tableColumn.pk === 1,
      nullable: tableColumn.notnull === 0,
      length: length > 0 ? parseInt(length) : null,
      autoincrement: pkCheck[0].pk === 0,
      primary_table: foreignCol ? foreignCol.table : null,
      primary_column: foreignCol ? foreignCol.to : null,
      relation_name: foreignCol ? foreignCol.from.replace('_id', '') : null,
      original_type: columnType,
    }
  })

  return columns
}

export async function validateConnection(dbInstance, Config, connection: string): Promise<void> {
  let dbConnection = Config.get(`database.${connection}`)

  if (!dbConnection) {
    exitInColors(
      `Invalid DB Connection [${connection}]. Ensure the connection is defined in config/database.ts`
    )
  }

  let dbType = dbConnection.client

  if (!supportedTypes.includes(dbType)) {
    exitInColors(
      `Unsupported DB Type [${dbType}]. Only [${supportedTypes.join(',')}] are supported`
    )
  }

  if (dbType === 'mysql') {
    try {
      let dbExist = await dbInstance.connection(connection).raw(`SELECT SCHEMA_NAME
  FROM INFORMATION_SCHEMA.SCHEMATA
 WHERE SCHEMA_NAME = '${dbConnection.connection.database}';`)

      if (dbExist[0][0]['SCHEMA_NAME'] !== dbConnection.connection.database) {
        exitInColors(`DB [${dbConnection.connection.database}] does not exist`)
      }
    } catch (err) {
      exitInColors(
        `Failed to connect to DB [${dbConnection.connection.database}]: ${err.toString()}`
      )
    }
  } else if (dbType === 'pg') {
    try {
      let dbExist = await dbInstance.connection(connection).raw(`
      SELECT datname FROM pg_catalog.pg_database
      WHERE lower(datname) = lower('${dbConnection.connection.database}');
      `)

      if (
        !dbExist['rows'][0] ||
        dbExist['rows'][0]['datname'] !== dbConnection.connection.database
      ) {
        exitInColors(`DB [${dbConnection.connection.database}] does not exist`)
      }
    } catch (err) {
      exitInColors(
        `Failed to connect to DB [${dbConnection.connection.database}]: ${err.toString()}`
      )
    }
  } else {
    let exists = false
    try {
      if (fs.existsSync(dbConnection.connection.filename)) {
        exists = true
      }
    } catch (err) {
      exists = false
    } finally {
      if (!exists) {
        exitInColors(`Failed to connect to DB [${dbConnection.connection.filename}]`)
      }
    }
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
}

export function pascalCase(string: string): string {
  return `${string}`
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w+)/, 'g'),
      (_$1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`
    )
    .replace(new RegExp(/\s/, 'g'), '')
    .replace(new RegExp(/\w/), (s) => s.toUpperCase())
}

export function camelCase(str: string): string {
  let pascal = pascalCase(str)
  let firsChar = pascal.charAt(0).toLowerCase()

  return firsChar + pascal.substring(1)
}

export function random(length: number = 10): string {
  let result = ''
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export function exitInColors(message: string): void {
  console.log('\x1b[41m', message, '\x1b[0m')
  process.exit(1)
}

export function resolveUrl(fullUrl: string, property: string): string {
  let parsed = url.parse(fullUrl)
  return parsed[property]
}

export function validEmail(emailToValidate: string): boolean {
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  return emailRegexp.test(emailToValidate)
}

export function toSnakeCase(string: string): string {
  string = String(string)

  return string
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('_')
}

export function titleCase(str) {
  str = String(str)
  return str.replace(/_/g, ' ').replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
  })
}

export function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(find, 'g'), replace)
}

export function resolveModelName(namespace: string): string | undefined {
  return namespace.split('/').pop()
}
