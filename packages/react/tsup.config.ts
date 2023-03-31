import type { Options } from 'tsup'

export default <Options>{
  entryPoints: ['src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  external: ['react', 'react-dom', '@fantasy-thumb/base'],
  dts: true
}
