import { html, render, TemplateResult } from 'ssr-lit-html'

export async function wrapTpl(sidebar: string | TemplateResult = '', content: string | TemplateResult = '', urlPrefix: string = '') {
    return render(html`
        <!DOCTYPE html>
        <html>

        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i|Ubuntu+Mono:400,400i,700,700i&amp;subset=latin-ext" rel="stylesheet">
            <link rel="stylesheet" href="${urlPrefix}assets/codemirror.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphiql@0.11.2/graphiql.css">
            <style>
                html, body, input, select, textarea {
                    font-family: 'Open Sans', sans-serif;
                    font-size: 15px;
                    line-height: 1.3em;
                }
                pre, code {
                    font-family: 'Ubuntu Mono', monospace;
                    font-size: 15px;
                    line-height: 1.3em;
                }
                a {
                    color: inherit;
                    text-decoration: underline;
                }
                a:hover {
                    color: inherit;
                    text-decoration: none;
                }
                body {
                    display: flex;
                    margin: 15px;
                    padding: 0;
                }
                .sidebar {
                    flex: 200px 1 1;
                    margin: 15px;
                }
                .main {
                    flex: 360px 1000 1000;
                    margin: 15px;
                }
            </style>
        </head>

        <body>
            <div class="sidebar">${sidebar}</div>
            <div class="main">${content}</div>
            <script src="${urlPrefix}assets/highlight.js"></script>
        </body>

        </html>
    `)
}
