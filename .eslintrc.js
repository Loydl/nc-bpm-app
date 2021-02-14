module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true, // Allows for the parsing of JSX
		},
	},
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-use-before-define': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'react/prop-types': 'off',
		quotes: ['error', 'single'],
		'comma-dangle': ['error', 'always-multiline'],
		'array-bracket-newline': ['error', 'consistent'],
		'quote-props': ['error', 'as-needed'],
		'indent': ['warn', 'tab'],
		semi: ["error", "always"],
	},
}