export interface Imports {
  [index:string]:string[]
}

export interface File {
  path: string
  imports: Imports
  exports: string[]
}

export interface Analysis {
  [index:string]:string[]
}
