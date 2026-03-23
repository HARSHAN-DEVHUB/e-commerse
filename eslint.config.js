module.exports = [
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'playwright-report/**', 'prisma/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {}
  }
]
