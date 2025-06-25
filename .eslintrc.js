module.exports = {
    env: {
        browser: false,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'no-console': 'off',
    },
    ignorePatterns: [
        'node_modules/',
        'cloi-mcp-server/',
        'bin/',
        '*.config.js',
        '*.cjs'
    ]
};
