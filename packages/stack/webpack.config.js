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
        index: path.resolve('src', 'index.ts')
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
        extensions: ['.tsx', '.ts', '.js']
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
        }),
    ],
    optimization: {
        minimize: this.mode === 'production',
        minimizer: [new TerserPlugin()]
    },
    externals: {
        react: 'module react',
        'react-dom': 'module react-dom',
        '@react-motion-router/core': 'module @react-motion-router/core',
        'web-animations-extension': 'module web-animations-extension'
    }
});