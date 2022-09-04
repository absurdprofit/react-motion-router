const path = require('path');
const {aliasWebpack, configPaths} = require('react-app-alias');

const options = {}; // default is empty for most cases

module.exports = function override(config) {
	config.resolve = {
		...config.resolve,
		// alias: {
		// 	...config.alias,
		// 	'@react-motion-router/core': path.resolve(__dirname, '../packages/core/build'),
		// 	'@react-motion-router/stack': path.resolve(__dirname, '../packages/stack/build'),
		// }
	}
	return config;
}