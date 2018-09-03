import compiler from '@ampproject/rollup-plugin-closure-compiler'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
    input: 'dist/highlight.js',
    output: {
        file: 'dist/assets/highlight.js',
        format: 'iife',
        name: 'highlight'
    },
    plugins: [
        resolve(),
        commonjs(),
        compiler({
            language_out: 'ECMASCRIPT6'
        })
    ]
}
