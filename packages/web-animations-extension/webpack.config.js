const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => ({
    mode: argv.mode ?? "production",
    devtool: "source-map",
    experiments: {
        outputModule: true
    },
    entry: {
        index: path.resolve('src', 'index.ts'),
        'common/utils': path.resolve('src', 'common', 'utils.ts')
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
        // clean: true,
        libraryTarget: 'module'
    },
    optimization: {
        minimize: this.mode === "production",
        minimizer: [new TerserPlugin()]
    }
});