import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import CheckboxGroup from '../checkbox-group.svelte';
import Checkbox from '../checkbox.svelte';

const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));
const attr = (html: string, pattern: RegExp) => pattern.exec(html)?.[1];

describe('Checkbox 服务端渲染', () => {
    it('首帧 HTML 含勾选状态、addon 与 extra 的 id 及其 aria 引用', () => {
        const { body } = render(Checkbox, { props: { checked: true, children: text('label'), extra: text('more') } });
        const addonId = attr(body, /id="([^"]+)" class="semi-checkbox-addon"/) ?? attr(body, /class="semi-checkbox-addon" id="([^"]+)"/);
        const extraId = attr(body, /id="([^"]+)" class="semi-checkbox-extra"/) ?? attr(body, /class="semi-checkbox-extra" id="([^"]+)"/);
        expect(body).toContain('semi-checkbox-checked');
        expect(addonId).toBeTruthy();
        expect(extraId).toBeTruthy();
        expect(body).toContain(`aria-labelledby="${addonId}"`);
        expect(body).toContain(`aria-describedby="${extraId}"`);
    });

    it('CheckboxGroup 首帧 HTML 含已选项与共同的 name', () => {
        const { body } = render(CheckboxGroup, { props: { value: ['b'], options: ['a', 'b'] } });
        expect(body.match(/semi-checkbox-checked/g)).toHaveLength(1);
        const names = Array.from(body.matchAll(/name="([^"]+)"/g), (match) => match[1]);
        expect(names).toHaveLength(2);
        expect(names[0]).toBe(names[1]);
    });
});
