export const MIRRORED_STYLES = ['fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'wordSpacing', 'lineHeight', 'tabSize', 'textTransform', 'whiteSpace', 'overflowWrap', 'wordBreak'] as const;

// The textarea wraps at word boundaries, which no width estimate reproduces; a hidden copy of the lines wraps the
// same way. Heights go straight onto the items, so a keystroke costs one layout and no extra render.
export function syncLineNumberHeights(textarea: HTMLTextAreaElement, panel: HTMLElement, lines: string[]) {
    const style = window.getComputedStyle(textarea);
    const mirror = document.createElement('div');
    for (const key of MIRRORED_STYLES) {
        mirror.style[key] = style[key];
    }
    Object.assign(mirror.style, {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        // rows still lay out at full height without adding scrollable overflow to the page
        blockSize: '0',
        overflow: 'hidden',
        boxSizing: 'content-box',
        inlineSize: `${textarea.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)}px`,
    });
    for (const line of lines) {
        const row = document.createElement('div');
        // an empty line still takes one row
        row.textContent = line || '​';
        mirror.append(row);
    }
    textarea.after(mirror);
    const heights = Array.from(mirror.children, (row) => row.getBoundingClientRect().height);
    mirror.remove();
    for (const [i, item] of Array.from(panel.children as HTMLCollectionOf<HTMLElement>).entries()) {
        item.style.minHeight = `${heights[i]}px`;
        item.style.lineHeight = style.lineHeight;
    }
}
