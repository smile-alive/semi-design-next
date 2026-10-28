import { expect, onTestFinished, vi } from 'vite-plus/test';
import { commands, page, server, userEvent } from 'vite-plus/test/browser';

declare module 'vitest/browser' {
    interface BrowserCommands {
        mouse: (type: 'move' | 'down' | 'up', x: number, y: number) => Promise<void>;
    }
}

// For tests that need Chromium-only facilities (CDP, Chrome's accessibility tree); use with `it.skipIf(!isChromium)`
export const isChromium = server.browser === 'chromium';
// For platform behavior only WebKit lacks (focus on click outside text fields); use with `it.skipIf(isWebKit)`
export const isWebKit = server.browser === 'webkit';

const OUTSIDE_TEST_ID = 'click-outside-target';

// A real click away from the components under test: Vitest locates document.body by its whole text, which breaks on
// change. Found by test id because a positional selector shifts when a closing popup removes its portal.
export async function clickOutside() {
    const target = document.createElement('div');
    target.dataset.testid = OUTSIDE_TEST_ID;
    target.style.cssText = 'position:fixed;right:0;bottom:0;width:8px;height:8px';
    document.body.appendChild(target);
    try {
        await page.getByTestId(OUTSIDE_TEST_ID).click();
    } finally {
        target.remove();
    }
}

// A silent WAV: a local media source with a known duration
export function silentWavUrl(seconds: number) {
    const sampleRate = 8000;
    const dataSize = sampleRate * seconds;
    const view = new DataView(new ArrayBuffer(44 + dataSize));
    const writeString = (offset: number, text: string) => {
        for (let i = 0; i < text.length; i++) {
            view.setUint8(offset + i, text.charCodeAt(i));
        }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    // 8-bit PCM silence is the midpoint value
    new Uint8Array(view.buffer, 44).fill(128);
    return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
}

// Makes the page behave as a browser without CSS field-sizing: the probe reports false, and the stylesheet's own
// `field-sizing: content` is overridden, so only the JS fallback can size textareas and inputs. Call before render.
export function disableFieldSizing() {
    const supports = CSS.supports.bind(CSS);
    vi.spyOn(CSS, 'supports').mockImplementation((property: string, value?: string) => (property === 'field-sizing' ? false : value === undefined ? supports(property) : supports(property, value)));
    const style = document.createElement('style');
    style.textContent = 'textarea, input { field-sizing: fixed !important; }';
    document.head.append(style);
    onTestFinished(() => style.remove());
}

// Moves the real mouse to (x, y) in this frame's viewport and presses or releases the left button there
export function mouse(type: 'move' | 'down' | 'up', x: number, y: number) {
    // Vitest runs every browser test inside an iframe of its runner page
    const frame = (window.frameElement as Element).getBoundingClientRect();
    return commands.mouse(type, frame.left + x, frame.top + y);
}

// Safari's Tab skips buttons, links and other non-text controls by default; Option-Tab is its key for reaching every control
const tabKey = server.browser === 'webkit' ? '{Alt>}{Tab}{/Alt}' : '{Tab}';

export function tab({ shift = false } = {}) {
    return userEvent.keyboard(shift ? `{Shift>}${tabKey}{/Shift}` : tabKey);
}

// Tabs until `target` has focus, so :focus-visible matches as it does for a keyboard user
export async function tabTo(target: Element, maxTabs = 30) {
    for (let i = 0; i < maxTabs && document.activeElement !== target; i++) {
        await tab();
    }
    expect(target).toHaveFocus();
}

// Presses a button from the keyboard: Safari does not focus a button on click, so focus could not return to it
export async function keyboardClick(button: HTMLElement) {
    button.focus();
    await userEvent.keyboard('{Enter}');
}

// Keyboard focus must show the Button theme ring (2px solid --semi-color-primary-light-active), not the user agent's
// `auto` ring. The probe sits next to the control so the token resolves in the same theme scope (`semi-always-dark`)
export function expectThemeFocusRing(el: Element) {
    const probe = document.createElement('span');
    probe.style.color = 'var(--semi-color-primary-light-active)';
    (el.parentElement ?? document.body).append(probe);
    const themeColor = getComputedStyle(probe).color;
    probe.remove();
    const { outlineStyle, outlineWidth, outlineColor } = getComputedStyle(el);
    expect({ outlineStyle, outlineWidth, outlineColor }).toEqual({
        outlineStyle: 'solid',
        outlineWidth: '2px',
        outlineColor: themeColor,
    });
}

// A real pointer drag from the centre of `source` to the centre of `target`. The small first move lets dnd-kit start the
// drag before the jump: in WebKit the single move of `userEvent.dragAndDrop` does not reorder anything.
export async function dragTo(source: Element, target: Element) {
    const center = (el: Element) => {
        const { left, top, width, height } = el.getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
    };
    const from = center(source);
    const to = center(target);
    await mouse('move', from.x, from.y);
    await mouse('down', from.x, from.y);
    await mouse('move', from.x + 5, from.y);
    await mouse('move', to.x, to.y);
    // dnd-kit resolves the drop target on a later frame, and a release before that drops where the drag started
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await mouse('up', to.x, to.y);
}

// WebKit goes back in history on Backspace outside a text field, which unloads the test page. Cancelled on the
// document, after the components' own handlers have seen the key.
export function preventBackspaceNavigation() {
    const prevent = (e: KeyboardEvent) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
        }
    };
    document.addEventListener('keydown', prevent);
    onTestFinished(() => document.removeEventListener('keydown', prevent));
}
