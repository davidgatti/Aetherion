export default [{
    files: ["**/*.js"],
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "commonjs",
        globals: {
            require: "readonly",
            module: "readonly",
            exports: "readonly",
            console: "readonly",
            process: "readonly",
            Buffer: "readonly",
            __dirname: "readonly",
            __filename: "readonly",
            global: "readonly"
        }
    },
    rules: {
        // Code quality rules
        "curly": "warn",
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "semi": ["error", "always"],
        "no-unused-vars": "warn",
        "no-console": "off",

        // Formatting rules
        "indent": ["error", 4, {
            "SwitchCase": 1,
            "VariableDeclarator": 1,
            "outerIIFEBody": 1,
            "FunctionDeclaration": { "parameters": 1, "body": 1 },
            "FunctionExpression": { "parameters": 1, "body": 1 },
            "CallExpression": { "arguments": 1 },
            "ArrayExpression": 1,
            "ObjectExpression": 1,
            "ImportDeclaration": 1,
            "flatTernaryExpressions": false,
            "ignoreComments": false
        }],
        "quotes": ["error", "single", { "avoidEscape": true }],
        "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }],
        "no-trailing-spaces": "error",
        "comma-dangle": ["error", "never"],
        "comma-spacing": ["error", { "before": false, "after": true }],
        "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
        "object-curly-spacing": ["error", "always"],
        "array-bracket-spacing": ["error", "never"],
        "space-before-blocks": "error",
        "space-before-function-paren": ["error", "never"],
        "space-in-parens": ["error", "never"],
        "space-infix-ops": "error",
        "keyword-spacing": ["error", { "before": true, "after": true }],
        "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
        "max-len": ["warn", {
            "code": 100,
            "tabWidth": 4,
            "ignoreComments": true,
            "ignoreUrls": true,
            "ignoreStrings": true,
            "ignoreTemplateLiterals": true
        }]
    }
}, {
    files: ["**/*.ts"],
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
    },
    rules: {
        "curly": "warn",
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "semi": "warn"
    }
}];
