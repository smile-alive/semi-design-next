import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import type { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vite-plus/test';
import { strings } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import type { PlaceholderProps } from '../interface';
import RichTextHost from './rich-text-host.svelte';

interface Store {
    id: string;
    log: string[];
    editor?: Editor;
    locale?: Locale;
    controls?: string;
    activeDescendant?: string;
    placeholder?: PlaceholderProps;
    defaultContent?: string;
}

function setup(initial: Partial<Store> = {}) {
    const store = createStore<Store>({ id: 'editor', log: [], ...initial });
    const result = render(RichTextHost, { props: { store } });
    flushSync();
    const pm = () => result.container.querySelector('.ProseMirror') as HTMLElement;
    return { ...result, store, pm, editor: () => store.editor as Editor };
}

describe('RichTextInput 编辑器宿主（attachment）', () => {
    it('挂载时创建编辑器：可编辑区带 id、可访问名称与 aria-placeholder，依次通知 ready、create', () => {
        const { pm, store } = setup({ placeholder: 'Ask anything' });
        expect(pm()).toHaveAttribute('contenteditable', 'true');
        expect(pm()).toHaveAttribute('id', 'editor');
        expect(pm()).toHaveAccessibleName(zh_CN.AIChatInput.input);
        expect(pm()).toHaveAttribute('aria-placeholder', 'Ask anything');
        expect(store.log.slice(0, 2)).toEqual(['ready', 'create']);
        expect(pm().parentElement).toHaveClass('semi-aiChatInput-editor-content');
    });

    it('defaultContent 作为初始内容，编辑后 onChange 收到纯文本', () => {
        const { pm, store, editor } = setup({ defaultContent: '<p>hello</p>' });
        expect(pm()).toHaveTextContent('hello');
        store.log.length = 0;
        // the end of the paragraph
        editor().commands.insertContentAt(editor().state.doc.content.size - 1, ' world');
        expect(store.log).toEqual(['change hello world']);
    });

    it('id、controls、activeDescendant 与 placeholder 变化时更新属性，编辑器不重建', () => {
        const { pm, store, editor } = setup({ placeholder: 'a' });
        const created = editor();
        store.id = 'next';
        store.controls = 'list';
        store.activeDescendant = 'list-1';
        store.placeholder = 'b';
        flushSync();
        expect(pm()).toHaveAttribute('id', 'next');
        expect(pm()).toHaveAttribute('aria-controls', 'list');
        expect(pm()).toHaveAttribute('aria-activedescendant', 'list-1');
        expect(pm()).toHaveAttribute('aria-placeholder', 'b');
        expect(editor()).toBe(created);
        expect(created.isDestroyed).toBe(false);
        expect(store.log.filter((entry) => entry === 'ready')).toHaveLength(1);
    });

    it('placeholder 变化后空段落显示新的占位文字', () => {
        const { pm, store } = setup({ placeholder: 'first' });
        expect(pm().querySelector('p')).toHaveAttribute('data-placeholder', 'first');
        store.placeholder = () => 'second';
        flushSync();
        expect(pm().querySelector('p')).toHaveAttribute('data-placeholder', 'second');
        // a function placeholder is not static text, so it is not exposed
        expect(pm()).not.toHaveAttribute('aria-placeholder');
    });

    it('LocaleProvider 切换语言时可访问名称跟随', () => {
        const { pm, store } = setup();
        store.locale = en_US;
        flushSync();
        expect(pm()).toHaveAccessibleName(en_US.AIChatInput.input);
    });

    it('焦点、键盘事件由外层元素转给回调', async () => {
        const { pm, store } = setup();
        store.log.length = 0;
        await fireEvent.focusIn(pm());
        await fireEvent.keyDown(pm(), { key: 'a' });
        await fireEvent.focusOut(pm());
        expect(store.log).toEqual(['focus', 'keydown', 'blur']);
    });

    it('卸载时销毁编辑器', () => {
        const { unmount, editor } = setup();
        const created = editor();
        unmount();
        flushSync();
        expect(created.isDestroyed).toBe(true);
    });
});

describe('RichTextInput 插槽节点视图', () => {
    const skill = '<skill-slot data-label="Writing" data-value="writing"></skill-slot>';

    it('skill 芯片显示标签，删除按钮只删除芯片并保留其后的文字', async () => {
        const { pm } = setup({ defaultContent: `<p>${skill}hello</p>` });
        expect(pm().querySelector('.node-skillSlot .skill-slot')).toHaveTextContent('Writing');
        const remove = pm().querySelector('.skill-slot-delete') as HTMLElement;
        expect(remove).toHaveAccessibleName(zh_CN.AIChatInput.removeSkill);
        await fireEvent.click(remove);
        flushSync();
        expect(pm().querySelector('.skill-slot')).toBeNull();
        expect(pm()).toHaveTextContent('hello');
    });

    it('节点视图读到外层的语言包，切换语言后跟随', () => {
        const { pm, store } = setup({ defaultContent: `<p>${skill}</p>` });
        store.locale = en_US;
        flushSync();
        expect(pm().querySelector('.skill-slot-delete')).toHaveAccessibleName(en_US.AIChatInput.removeSkill);
    });

    it('input slot 的内容渲染进节点视图的内容元素，只有零宽字符时显示占位', () => {
        const { pm, editor } = setup({ defaultContent: '<p>write <input-slot placeholder="object"></input-slot></p>' });
        const slot = pm().querySelector('.node-inputSlot') as HTMLElement;
        const placeholder = slot.querySelector('.input-slot-placeholder') as HTMLElement;
        expect(placeholder).toHaveTextContent('object');
        expect(slot.querySelector('.content')?.textContent).toBe(strings.ZERO_WIDTH_CHAR);
        expect(placeholder).toBeVisible();

        let slotPos = -1;
        editor().state.doc.descendants((node, pos) => {
            if (node.type.name === 'inputSlot') {
                slotPos = pos;
            }
        });
        // inside the slot, after its zero-width character
        editor()
            .chain()
            .setTextSelection(slotPos + 2)
            .insertContent('cats')
            .run();
        flushSync();
        expect(slot.querySelector('.content')).toHaveTextContent('cats');
        expect(placeholder).not.toBeVisible();
    });

    const options = JSON.stringify(['a', 'b']).replaceAll('"', '&quot;');
    const select = (value: string) => `<select-slot value="${value}" options="${options}"></select-slot>`;

    it('select slot 渲染为带选项的 Select，选择后写回节点属性', async () => {
        const { pm, editor } = setup({ defaultContent: `<p>${select('a')}</p>` });
        const combobox = pm().querySelector('.node-selectSlot [role="combobox"]') as HTMLElement;
        expect(combobox).toHaveTextContent('a');
        await fireEvent.click(combobox);
        const listbox = document.getElementById(combobox.getAttribute('aria-controls') as string) as HTMLElement;
        expect([...listbox.querySelectorAll('[role="option"]')].map((option) => option.textContent?.trim())).toEqual(['a', 'b']);
        await fireEvent.click(listbox.querySelectorAll('[role="option"]')[1]);
        flushSync();
        expect(JSON.stringify(editor().getJSON())).toContain('"value":"b"');
        expect(combobox).toHaveTextContent('b');
    });

    it('两个 select slot 的 listbox id 不同', () => {
        const { pm } = setup({ defaultContent: `<p>${select('a')} and ${select('b')}</p>` });
        const [first, second] = [...pm().querySelectorAll('.node-selectSlot [role="combobox"]')].map((combobox) => combobox.getAttribute('aria-controls'));
        expect(first).toBeTruthy();
        expect(second).toBeTruthy();
        expect(first).not.toBe(second);
    });

    it('编辑器销毁时卸载节点视图', () => {
        const { pm, unmount } = setup({ defaultContent: `<p>${skill}</p>` });
        const button = pm().querySelector('.skill-slot-delete') as HTMLElement;
        unmount();
        flushSync();
        expect(button.isConnected).toBe(false);
    });
});
