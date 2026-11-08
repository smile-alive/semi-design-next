import { Schema, type Node as PMNode } from '@tiptap/pm/model';
import { EditorState, Plugin, TextSelection } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { describe, expect, it, vi } from 'vite-plus/test';
import { ensureTrailingText, handleCompositionEndLogic, handlePasteLogic, handleTextInputLogic, handleZeroWidthCharLogic, keyDownHandlePlugin, specialPasteLogicForInputSlot } from '../extension/plugins';

// FEFF is the zero-width character the editor puts around custom slots; Z stands for it in the shape strings
const ZWC = '﻿';

const customSlotAttrs = { isCustomSlot: { default: true } };
const schema = new Schema({
    nodes: {
        doc: { content: 'block+', toDOM: () => ['div', 0] },
        paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
        text: { group: 'inline' },
        customSlot: { group: 'inline', inline: true, atom: true, attrs: customSlotAttrs, toDOM: () => ['span'] },
        inputSlot: {
            group: 'inline',
            inline: true,
            content: 'inline*',
            attrs: customSlotAttrs,
            toDOM: () => ['input-slot', 0],
        },
    },
});

const t = (text: string) => schema.text(text);
const slot = () => schema.node('customSlot');
const input = (text?: string) => schema.node('inputSlot', null, text ? [t(text)] : []);
const p = (...children: PMNode[]) => schema.node('paragraph', null, children);
const doc = (...paragraphs: PMNode[]) => schema.node('doc', null, paragraphs);

const shape = (view: EditorView) => view.state.doc.toString().replaceAll(ZWC, 'Z');

function createView(root: PMNode, from: number, to = from) {
    const state = EditorState.create({ doc: root, selection: TextSelection.create(root, from, to) });
    return new EditorView(document.createElement('div'), { state });
}

function press(view: EditorView, key: string) {
    const plugin: Plugin = keyDownHandlePlugin(schema);
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    const handled = plugin.props.handleKeyDown.call(plugin, view, event);
    return { handled, prevented: event.defaultPrevented };
}

describe('keyDownHandlePlugin 方向键', () => {
    it('ArrowLeft 在 [slot, ZWC, caret] 时把光标移到 slot 之前', () => {
        const view = createView(doc(p(slot(), t(ZWC))), 3);
        expect(press(view, 'ArrowLeft')).toEqual({ handled: true, prevented: true });
        expect(view.state.selection.from).toBe(1);
    });

    it('ArrowLeft 在 [inputSlot, ZWC, caret] 时把光标移到输入槽内容末尾', () => {
        const view = createView(doc(p(input('ab'), t(ZWC))), 6);
        press(view, 'ArrowLeft');
        expect(view.state.selection.from).toBe(4);
        expect(view.state.selection.$from.parent.type.name).toBe('inputSlot');
    });

    it('ArrowRight 在 [caret, ZWC, inputSlot] 时把光标移到输入槽内容开头', () => {
        const view = createView(doc(p(t(ZWC), input('ab'))), 1);
        press(view, 'ArrowRight');
        expect(view.state.selection.from).toBe(3);
        expect(view.state.selection.$from.parent.type.name).toBe('inputSlot');
    });

    it('输入槽只剩 ZWC 时，一次方向键就离开槽', () => {
        const view = createView(doc(p(t(ZWC), input(ZWC), t(ZWC))), 4);
        press(view, 'ArrowLeft');
        expect(view.state.selection.from).toBe(2);
        expect(view.state.selection.$from.parent.type.name).toBe('paragraph');
    });

    it('没有零宽字符可跨时不处理方向键', () => {
        const view = createView(doc(p(t('ab'))), 2);
        expect(press(view, 'ArrowLeft')).toEqual({ handled: false, prevented: false });
    });

    it('输入法组合期间不处理任何按键', () => {
        const view = createView(doc(p(slot(), t(ZWC))), 3);
        Object.defineProperty(view, 'composing', { get: () => true });
        expect(press(view, 'ArrowLeft').handled).toBe(false);
        expect(press(view, 'Backspace').handled).toBe(false);
    });
});

describe('keyDownHandlePlugin Backspace', () => {
    it('slot 前只剩一个字符时，Backspace 把它换成 ZWC 而不删掉 slot', () => {
        const view = createView(doc(p(t('x'), slot(), t(ZWC))), 2);
        expect(press(view, 'Backspace').prevented).toBe(true);
        expect(shape(view)).toBe('doc(paragraph("Z", customSlot, "Z"))');
    });

    it('[slot, caret, ZWC] 时 Backspace 连同后面的 ZWC 一起删除 slot', () => {
        const view = createView(doc(p(t('a'), slot(), t(ZWC))), 3);
        press(view, 'Backspace');
        expect(shape(view)).toBe('doc(paragraph("a"))');
    });

    it('[slot, ZWC, caret] 时 Backspace 连同 ZWC 一起删除 slot', () => {
        const view = createView(doc(p(t('a'), slot(), t(ZWC))), 4);
        press(view, 'Backspace');
        expect(shape(view)).toBe('doc(paragraph("a"))');
    });

    it('输入槽内删除最后一个可见字符后保留 ZWC，槽不消失', () => {
        const view = createView(doc(p(t(ZWC), input('a'), t(ZWC))), 4);
        press(view, 'Backspace');
        expect(shape(view)).toBe('doc(paragraph("Z", inputSlot("Z"), "Z"))');
    });

    it('输入槽只剩 ZWC 时 Backspace 删除整个槽', () => {
        const view = createView(doc(p(t(ZWC), input(ZWC), t(ZWC))), 4);
        press(view, 'Backspace');
        expect(shape(view)).not.toContain('inputSlot');
    });

    it('光标在输入槽开头时，Backspace 只把光标移到前面的 ZWC 之前', () => {
        const view = createView(doc(p(t(`a${ZWC}`), input('b'), t(ZWC))), 4);
        press(view, 'Backspace');
        expect(shape(view)).toBe('doc(paragraph("aZ", inputSlot("b"), "Z"))');
        expect(view.state.selection.from).toBe(2);
    });

    it('选区覆盖整个输入槽内容时，Backspace 留下 ZWC 且光标在其后', () => {
        const view = createView(doc(p(t(ZWC), input('abc'), t(ZWC))), 3, 6);
        press(view, 'Backspace');
        expect(shape(view)).toBe('doc(paragraph("Z", inputSlot("Z"), "Z"))');
        expect(view.state.selection.empty).toBe(true);
    });

    it('选区紧邻 ZWC 时，Backspace 一并删除相邻的 ZWC', () => {
        const view = createView(doc(p(t(`${ZWC}ab`))), 2, 3);
        press(view, 'Backspace');
        expect(shape(view)).toBe('doc(paragraph("b"))');
    });

    it('普通文本中的 Backspace 交给浏览器默认行为', () => {
        const view = createView(doc(p(t('ab'))), 3);
        expect(press(view, 'Backspace')).toEqual({ handled: false, prevented: false });
    });

    it('[ZWC, slot, caret] 位于段末且没有尾随 ZWC 时，Backspace 连同前面的 ZWC 删除 slot', () => {
        const view = createView(doc(p(t(ZWC), slot())), 3);
        expect(press(view, 'Backspace').prevented).toBe(true);
        expect(shape(view)).toBe('doc(paragraph)');
    });
});

describe('keyDownHandlePlugin 跨段落', () => {
    // the first paragraph "ab" spans 0-4, so the second paragraph's content starts at 5
    const twoParagraphs = () => doc(p(t('ab')), p(t(ZWC), slot(), t(ZWC)));

    it('ArrowLeft 在 [上一段, 换行, ZWC, caret] 时把光标移到上一段末尾', () => {
        const view = createView(twoParagraphs(), 6);
        expect(press(view, 'ArrowLeft').prevented).toBe(true);
        expect(view.state.selection.from).toBe(3);
    });

    it('ArrowRight 在 [caret, ZWC, 换行, 下一段] 时把光标移到下一段开头', () => {
        // "a", slot, ZWC span 1-4; the second paragraph's content starts at 6
        const view = createView(doc(p(t('a'), slot(), t(ZWC)), p(t('b'))), 3);
        expect(press(view, 'ArrowRight').prevented).toBe(true);
        expect(view.state.selection.from).toBe(6);
    });

    it('Backspace 在 [上一段, 换行, caret, ZWC] 时并入上一段并删掉 ZWC', () => {
        const view = createView(twoParagraphs(), 5);
        expect(press(view, 'Backspace').prevented).toBe(true);
        expect(shape(view)).toBe('doc(paragraph("ab", customSlot, "Z"))');
    });

    it('Backspace 在 [上一段, 换行, ZWC, caret, slot] 时并入上一段并删掉 ZWC', () => {
        const view = createView(twoParagraphs(), 6);
        expect(press(view, 'Backspace').prevented).toBe(true);
        expect(shape(view)).toBe('doc(paragraph("ab", customSlot, "Z"))');
    });
});

describe('keyDownHandlePlugin ZWC 并入较长文本节点', () => {
    it('ArrowLeft 在 ["aZ", caret, slot] 时跨过 ZWC 与前一个字符', () => {
        const view = createView(doc(p(t(`a${ZWC}`), slot(), t(ZWC))), 3);
        expect(press(view, 'ArrowLeft').prevented).toBe(true);
        expect(view.state.selection.from).toBe(1);
    });

    it('ArrowRight 在 [slot, caret, "Zab"] 时跨过 ZWC 停在第一个字符之后', () => {
        const view = createView(doc(p(slot(), t(`${ZWC}ab`))), 2);
        expect(press(view, 'ArrowRight')).toEqual({ handled: true, prevented: true });
        expect(view.state.selection.from).toBe(4);
    });

    it('ArrowRight 在 [slot, "Z", caret, "ab"] 时交给默认行为，不跳过可见字符', () => {
        const view = createView(doc(p(slot(), t(`${ZWC}ab`))), 3);
        expect(press(view, 'ArrowRight')).toEqual({ handled: false, prevented: false });
        expect(view.state.selection.from).toBe(3);
    });
});

describe('输入与输入法', () => {
    it('handleTextInputLogic 在 ZWC 旁输入时先删掉 ZWC 再插入文字', () => {
        const view = createView(doc(p(t(ZWC), slot(), t(ZWC))), 4);
        expect(handleTextInputLogic(view, 4, 4, 'x')).toBe(true);
        expect(shape(view)).toBe('doc(paragraph("Z", customSlot, "x"))');
        expect(view.state.selection.from).toBe(4);
    });

    it('handleTextInputLogic 旁边没有 ZWC 时交给默认输入', () => {
        const view = createView(doc(p(t('ab'))), 2);
        expect(handleTextInputLogic(view, 2, 2, 'x')).toBe(false);
        expect(shape(view)).toBe('doc(paragraph("ab"))');
    });

    it('handleCompositionEndLogic 清掉输入槽内与上屏文字混在一起的 ZWC', () => {
        // the slot content "Zab" spans 3-6
        const view = createView(doc(p(t(ZWC), input(`${ZWC}ab`), t(ZWC))), 6);
        handleCompositionEndLogic(view);
        expect(shape(view)).toBe('doc(paragraph("Z", inputSlot("ab"), "Z"))');
    });

    it('handleCompositionEndLogic 删掉光标前文本开头的 ZWC', () => {
        const view = createView(doc(p(t(`${ZWC}a`))), 3);
        handleCompositionEndLogic(view);
        expect(shape(view)).toBe('doc(paragraph("a"))');
    });

    it('ensureTrailingText 只在输入法组合期间忽略输入槽内合成的 Backspace', () => {
        const root = doc(p(t(ZWC), input('ab'), t(ZWC)));
        const handled = new Plugin({ props: { handleKeyDown: () => true } });
        const state = EditorState.create({
            doc: root,
            selection: TextSelection.create(root, 4),
            plugins: [ensureTrailingText(schema), handled],
        });
        const view = new EditorView(document.createElement('div'), { state });
        // ProseMirror replays a DOM deletion as a plain Event carrying key: 'Backspace' (jsdom cannot create a trusted
        // KeyboardEvent, so the real-key path is not covered here)
        const synthetic = Object.assign(new Event('keydown'), { key: 'Backspace' }) as KeyboardEvent;
        const runKeyDown = () => view.someProp('handleKeyDown', (f) => f(view, synthetic));

        expect(runKeyDown()).toBe(true);
        Object.defineProperty(view, 'composing', { configurable: true, get: () => true });
        expect(runKeyDown()).toBeFalsy();
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));
        expect(runKeyDown()).toBe(true);
        view.destroy();
    });
});

describe('handleZeroWidthCharLogic', () => {
    const applyTransform = (root: PMNode) => {
        const state = EditorState.create({ doc: root });
        const tr = handleZeroWidthCharLogic(state);
        return tr ? tr.doc.toString().replaceAll(ZWC, 'Z') : null;
    };

    it('以 slot 开头和结尾的段落两端补 ZWC', () => {
        expect(applyTransform(doc(p(slot())))).toBe('doc(paragraph("Z", customSlot, "Z"))');
    });

    it('相邻的两个 slot 之间补一个 ZWC', () => {
        expect(applyTransform(doc(p(t('a'), slot(), slot(), t('b'))))).toBe('doc(paragraph("a", customSlot, "Z", customSlot, "b"))');
    });

    it('空输入槽补一个 ZWC 用于渲染与放置光标', () => {
        expect(applyTransform(doc(p(t('a'), input(), t('b'))))).toBe('doc(paragraph("a", inputSlot("Z"), "b"))');
    });

    it('段落只有一个 ZWC 时将其移除', () => {
        expect(applyTransform(doc(p(t(ZWC))))).toBe('doc(paragraph)');
    });

    it('已经规范的文档不产生事务', () => {
        expect(applyTransform(doc(p(t('a'), slot(), t(ZWC))))).toBeNull();
    });
});

describe('handlePasteLogic', () => {
    const pasteEvent = (text: string) => ({ clipboardData: { getData: () => text }, preventDefault: vi.fn<() => void>() }) as unknown as ClipboardEvent;

    it('普通段落里先删掉光标旁的 ZWC，再交给默认粘贴', () => {
        const view = createView(doc(p(slot(), t(ZWC))), 3);
        expect(handlePasteLogic(view, pasteEvent('x'))).toBe(false);
        expect(shape(view)).toBe('doc(paragraph(customSlot))');
    });

    it('光标在输入槽里时按输入槽规则拦截', () => {
        const view = createView(doc(p(t(ZWC), input(ZWC), t(ZWC))), 3);
        expect(handlePasteLogic(view, pasteEvent('hello'))).toBe(true);
        expect(shape(view)).toBe('doc(paragraph("Z", inputSlot("hello"), "Z"))');
    });
});

describe('specialPasteLogicForInputSlot', () => {
    const paste = (root: PMNode, from: number, to: number, text: string) => {
        const view = createView(root, from, to);
        const event = {
            clipboardData: { getData: () => text },
            preventDefault: vi.fn<() => void>(),
        } as unknown as ClipboardEvent;
        const handled = specialPasteLogicForInputSlot(event, view.state.selection.$from, view.state.tr, (tr) => view.dispatch(tr), view.state.selection);
        return { handled, view, event };
    };

    it('粘贴到只有 ZWC 的输入槽时，纯文本替换 ZWC', () => {
        const { handled, view } = paste(doc(p(t(ZWC), input(ZWC), t(ZWC))), 3, 3, 'hello');
        expect(handled).toBe(true);
        expect(shape(view)).toBe('doc(paragraph("Z", inputSlot("hello"), "Z"))');
    });

    it('粘贴到全选内容的输入槽时，纯文本替换原内容', () => {
        const { view } = paste(doc(p(t(ZWC), input('abc'), t(ZWC))), 3, 6, 'x');
        expect(shape(view)).toBe('doc(paragraph("Z", inputSlot("x"), "Z"))');
    });

    it('剪贴板没有纯文本，或槽里已有可见内容且未全选时不拦截', () => {
        expect(paste(doc(p(t(ZWC), input(ZWC), t(ZWC))), 3, 3, '').handled).toBe(false);
        expect(paste(doc(p(t(ZWC), input('abc'), t(ZWC))), 4, 4, 'x').handled).toBe(false);
    });
});
