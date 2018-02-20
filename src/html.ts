import { ntml } from 'lit-ntml'

export const html = ntml()

export function repeat<T>(items: T[], tpl: (el: T, i: number) => Promise<string>) {
    return Promise.all(items.map(tpl))
        .then(render => render.join(''))
}

export function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}