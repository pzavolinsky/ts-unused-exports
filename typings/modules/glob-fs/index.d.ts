declare function initialize (options: any): {
  readdirSync(glob: string): string[]
}

declare module 'glob-fs' {
  export = initialize
}
