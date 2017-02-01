module.exports = {
  "env": {
    "node": true,
    "es6": true,
    "mocha": true,
    "mongo": true
  },
  "globals": {
    "it": true,
    "describe": true,
    "before": true,
    "beforeEach": true,
    "after": true,
    "afterEach": true,
    "$": true,
    "window": true,
    "hljs": true,
    "log": true,
    "initOAuth": true,
    "SwaggerUi": true,
    "ApiKeyAuthorization": true
  },
  "rules": {
    "no-bitwise": 2,
    "camelcase": 2,
    "curly": 0,
    "eqeqeq": 2,
    "wrap-iife": [
      2,
      "any"
    ],
    "indent": [
      2,
      2,
      {
        "SwitchCase": 1
      }
    ],
    "no-use-before-define": [
      "error",
      {
        "functions": false
      }
    ],
    "new-cap": 0,
    "no-caller": 2,
    "quotes": [
      2,
      "single"
    ],
    "no-undef": 2,
    "no-unused-vars": 0,
    "strict": 0
  }
}
