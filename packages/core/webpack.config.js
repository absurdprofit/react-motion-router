const path = require('path');
const webpack = require('webpack');
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
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
        clean: true,
        libraryTarget: 'module'
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser'
        })
    ],
    optimization: {
        minimize: this.mode === "production",
        minimizer: [new TerserPlugin()]
    },
    externals: {
        react: 'module react',
        'react-dom': 'module react-dom',
        '@virtualstate/navigation': 'module @virtualstate/navigation',
        'urlpattern-polyfill': 'module urlpattern-polyfill'
    }
});