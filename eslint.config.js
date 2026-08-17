//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      '.output/**',
      '.vinxi/**',
      'eslint.config.js',
      'prettier.config.js',
    ],
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      // These files track shadcn's registry source, including its defensive
      // compatibility checks and inline type imports.
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      'import/consistent-type-specifier-style': 'off',
      'no-shadow': 'off',
    },
  },
]
