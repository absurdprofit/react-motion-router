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
        minimize: env.production === 'production',
        minimizer: [new TerserPlugin()]
    },
    externals: {
        react: 'module react',
        'react-dom': 'module react-dom',
        '@react-motion-router/core': 'module @react-motion-router/core',
        'web-animations-extension': 'module web-animations-extension'
    }
});