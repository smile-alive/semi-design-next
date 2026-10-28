/**
 * Escape HTML angle brackets in markdown text, preserving fenced code blocks (opening fence indented by up to 3 spaces) and inline code; indented (4-space) code blocks are not recognized.
 *
 * In `format='md'` mode, @mdx-js/mdx uses `rehypeRemoveRaw` which strips all raw HTML nodes.
 * This causes user-typed HTML-like content (e.g. `<AgentChat />`) to silently disappear.
 * By escaping `<` to `&lt;` outside of code spans/blocks, the markdown parser treats them
 * as literal text instead of HTML tags.
 */
export function escapeHtmlInMarkdown(text: string) {
    const lines = text.split('\n');
    const result: string[] = [];
    let fenceChar: string | null = null;
    let fenceLen = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (fenceChar !== null) {
            result.push(line);
            // CommonMark lets a closing fence be indented by up to 3 spaces, like the opening one
            const closing = line.match(/^ {0,3}(`+|~+)\s*$/)?.[1];
            if (closing && closing.length >= fenceLen && closing[0] === fenceChar) {
                fenceChar = null;
            }
        } else {
            // up to 3 spaces: a fence inside a list item is indented by its content offset
            const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);
            if (fenceMatch) {
                fenceChar = fenceMatch[1][0];
                fenceLen = fenceMatch[1].length;
                result.push(line);
            } else {
                result.push(escapeAngleBracketsOutsideInlineCode(line));
            }
        }
    }

    return result.join('\n');
}

/**
 * Escape `<` to `&lt;` in a single line, but preserve content inside inline code spans.
 */
function escapeAngleBracketsOutsideInlineCode(line: string) {
    const parts: string[] = [];
    let i = 0;

    while (i < line.length) {
        if (line[i] === '`') {
            let count = 0;
            const start = i;
            while (i < line.length && line[i] === '`') {
                count++;
                i++;
            }
            const closer = '`'.repeat(count);
            const closeIdx = line.indexOf(closer, i);
            if (closeIdx !== -1) {
                parts.push(line.slice(start, closeIdx + count));
                i = closeIdx + count;
            } else {
                // unmatched backticks are literal text, so `<` after them is still escaped
                parts.push(line.slice(start, i).replace(/</g, '&lt;'));
            }
        } else if (line[i] === '<') {
            parts.push('&lt;');
            i++;
        } else {
            const next = line.indexOf('<', i);
            const nextBt = line.indexOf('`', i);
            let end: number;
            if (next === -1 && nextBt === -1) {
                end = line.length;
            } else if (next === -1) {
                end = nextBt;
            } else if (nextBt === -1) {
                end = next;
            } else {
                end = Math.min(next, nextBt);
            }
            parts.push(line.slice(i, end));
            i = end;
        }
    }

    return parts.join('');
}
