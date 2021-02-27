/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');

const fileLoader = {
	loader: 'file-loader',
	options: {
		name: '[path][name]-[sha1:hash:hex:8].[ext]',
		outputPath: '../assets/',
	},
};

module.exports = {
	entry: {
		filelist: [
			path.join(__dirname, 'src', 'filelist.ts'),
		],
		admin: [
			path.join(__dirname, 'src', 'admin.ts'),
		],
	},
	output: {
		path: path.resolve(__dirname, './js'),
		publicPath: '/js/',
		filename: '[name].js',
		chunkFilename: 'chunks/[name]-[hash].js',
	},
	performance: {
		maxAssetSize: 2 * 1024 * 1024,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							babelrc: false,
						},
					},
					'ts-loader',
				],
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.scss$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
			{
				test: /\.tsx?$/,
				enforce: 'pre',
				use: [
					{
						options: {
							eslintPath: require.resolve('eslint'),

						},
						loader: require.resolve('eslint-loader'),
					},
				],
				exclude: /node_modules/,
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(png|jpg|gif|svg)(\?.+)?$/,
				loader: 'url-loader',
				options: {
					name: '[name].[ext]?[hash]',
					limit: 8192,
				},
			},
			{
				test: /.*\.(ttf|woff|woff2|eot)(\?.+)?$/,
				use: [fileLoader],
			},
		],
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
		}),
	],
	resolve: {
		extensions: ['*', '.tsx', '.ts', '.js', '.scss'],
		symlinks: false,
	},
};
