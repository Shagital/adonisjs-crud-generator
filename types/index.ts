export interface IConnection {
  database: string
}

export interface IConnectionObj {
  client: string
  connection: IConnection
}

export interface IColumn {
  type: string
  unique: boolean
  primary: boolean
  nullable: boolean
  length: number | null
  autoincrement: boolean
  primary_table: string | null
  primary_column: string | null
  relation_name: string | null
  original_type: string | null
}

export interface IPrimaryColumn extends IColumn {
  name: string | null
  autoincrement: boolean
}

export interface IGeneric extends Array<any> {
  name: string | null
}

export interface IForeignKey {
  from: string,
  table: string | null,
  to: string
}

export interface IIndex {
  name: string,
  unique: number,
  indexes: Array<IGeneric>
}
