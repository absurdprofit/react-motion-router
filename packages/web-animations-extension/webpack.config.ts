import path from 'path';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';

export default (env: any): webpack.Configuration => ({
    mode: env.production ? 'production' : 'development',
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
        minimize: env.production === "production",
        minimizer: [new TerserPlugin()]
    }
});