// The token tables read SCSS one declaration per line, but oxfmt wraps long declarations and selector lists over
// several lines. This joins each statement back onto one line, with its comments at the end, as "code comment".
export function scssStatements(raw: string) {
    const statements: string[] = [];
    let code = '';
    let comments: string[] = [];
    for (const line of raw.split('\n').map((text) => text.trim())) {
        if (!code && (!line || line.startsWith('//') || line.startsWith('/*'))) {
            statements.push(line);
            continue;
        }
        const commentAt = line.search(/\/\/|\/\*/);
        const part = commentAt < 0 ? line : line.slice(0, commentAt).trim();
        if (commentAt >= 0) {
            comments.push(line.slice(commentAt));
        }
        code = code ? `${code} ${part}` : part;
        if (/[;{}]$/.test(code)) {
            // a wrapped parenthesized value reads `(a + b)` again, not `( a + b )`
            const joined = code.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
            statements.push([joined, ...comments].join(' '));
            code = '';
            comments = [];
        }
    }
    if (code) {
        statements.push([code, ...comments].join(' '));
    }
    return statements;
}
