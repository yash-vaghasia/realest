import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  // Global ignores must live in their own config block (flat-config rule).
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'src/app/(payload)/admin/importMap.js',
      'src/migrations/**', // payload-generated, never hand-edited
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Loosen a couple of next/typescript defaults that don't earn their keep
      // in a Payload + App-Router scaffold. Tighten back as the codebase matures.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
