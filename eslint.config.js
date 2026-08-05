import neostandard from 'neostandard'

export default [
  { ignores: ['node_modules/**', 'test/tmp-*/**'] },
  ...neostandard(),
  {
    rules: {
      '@stylistic/space-before-function-paren': ['error', 'never']
    }
  }
]
