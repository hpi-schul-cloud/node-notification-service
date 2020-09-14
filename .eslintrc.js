module.exports = {
	parser: '@typescript-eslint/parser',
	extends: [
		'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
		'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
		'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
	],
	parserOptions: {
		ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module', // Allows for the use of imports
	},
	rules: {
		'prettier/prettier': ['error'],
		// 'match-default-export-name': false,
		// 'interface-name': false,
		// 'ordered-imports': false,
		// 'object-literal-sort-keys': false,
		// 'no-consecutive-blank-lines': false,
		// 'unified-signatures': false,
		// 'no-var-requires': false,
		// 'no-unused-expression': false,
		// 'max-line-length': [
		//   true,
		//   {
		//     limit: 180,
		//     'ignore-pattern': '^import |^export {(.*?)}',
		//   },
		// ],
	},
};
