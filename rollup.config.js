import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'

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
        uglify({
            toplevel: true
        })
    ]
}