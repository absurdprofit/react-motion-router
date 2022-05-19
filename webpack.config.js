const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    mode: "production",
    experiments: {
        outputModule: true
    },
    entry: {
        index: './src/index.ts',
        utils: './src/common/utils.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/,
                    /example/
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
        minimize: true,
        minimizer: [new TerserPlugin()]
    },
    externals: {
        react: 'commonjs react',
        'react-dom': 'commonjs react-dom'
    }
};