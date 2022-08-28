const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: "production",
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
        }),
        // new CopyPlugin({
        //     patterns: [
        //         {
        //             from: path.resolve(__dirname, 'package.json'),
        //             to: path.resolve(__dirname, 'build', 'package.json')
        //         },
        //         {
        //             from: path.resolve(__dirname, 'README.md'),
        //             to: path.resolve(__dirname, 'build', 'README.md')
        //         }
        //     ]
        // })
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