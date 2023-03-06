import type { Options } from 'tsup'

export default <Options>{
  entryPoints: ['src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  external: ['react', 'react-dom', '@thumb-fantasy/base'],
  dts: true
}
