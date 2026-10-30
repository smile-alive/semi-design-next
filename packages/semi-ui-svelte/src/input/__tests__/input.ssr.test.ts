import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import InputCase from './input-case.svelte';
import TextAreaCase from './textarea-case.svelte';

type Case = NonNullable<Parameters<typeof InputCase>[1]>['store'];
type TextAreaStore = NonNullable<Parameters<typeof TextAreaCase>[1]>['store'];

describe('Svelte Input 服务端首帧', () => {
    it('受控值在服务端 HTML 中已写入 value', () => {
        const store = createStore<Case>({ props: { value: 'controlled' } });
        const { body } = render(InputCase, { props: { store } });
        expect(body).toContain('value="controlled"');
    });

    it('首帧带类名、type 与 prefix、addon 容器', () => {
        const store = createStore<Case>({ props: { size: 'large', showClear: true, value: 'a' }, slots: { prefix: 'P', addonAfter: 'after' } });
        const { body } = render(InputCase, { props: { store } });
        expect(body).toContain('semi-input-large');
        expect(body).toContain('type="text"');
        expect(body).toContain('semi-input-prefix');
        expect(body).toContain('semi-input-append');
        expect(body).toContain('semi-input-clearbtn');
        expect(body).toContain('semi-input-wrapper__with-prefix');
    });

    it('TextArea 首帧带内容、计数与行号', () => {
        const store = createStore<TextAreaStore>({ props: { value: 'a\nb', maxCount: 10, showLineNumber: true } });
        const { body } = render(TextAreaCase, { props: { store } });
        expect(body).toContain('>a\nb</textarea>');
        expect(body).toContain('semi-input-textarea-counter');
        expect(body).toMatch(/counter">3.*\/10/);
        expect(body).toContain('semi-input-textarea-lineNumber-item');
    });
});
