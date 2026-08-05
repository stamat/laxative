import neostandard from 'neostandard'

export default [
  { ignores: ['node_modules/**', 'docs/dist/**', 'test/tmp-*/**'] },
  ...neostandard(),
  {
    rules: {
      '@stylistic/space-before-function-paren': ['error', 'never']
    }
  }
]
