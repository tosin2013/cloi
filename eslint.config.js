export default [
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                
                // Browser/Timer globals that Node.js also has
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                fetch: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { 
                argsIgnorePattern: '^_', 
                varsIgnorePattern: '^_',
                caughtErrors: 'none'
            }],
            'no-console': 'off',
            'no-undef': 'error',
        },
        ignores: [
            'node_modules/**',
            'cloi-mcp-server/**',
            'bin/**',
            '*.config.js',
            '*.cjs',
            'test_env/**',
            '.git/**',
        ],
    },
]; 