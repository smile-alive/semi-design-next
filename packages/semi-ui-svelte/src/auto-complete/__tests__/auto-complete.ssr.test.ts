import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { AutoComplete } from '..';

describe('Svelte AutoComplete 服务端首帧', () => {
    it('首帧带 combobox 角色、名称、当前值与关闭状态，没有 listbox', () => {
        const { body } = render(AutoComplete, { props: { 'aria-label': '城市', value: 'semi', data: ['semi', 'design'], placeholder: '输入' } });
        expect(body).toContain('semi-autocomplete');
        expect(body).toMatch(/<input[^>]*role="combobox"/);
        expect(body).toContain('aria-label="城市"');
        expect(body).toContain('aria-expanded="false"');
        expect(body).toContain('aria-haspopup="listbox"');
        expect(body).toContain('value="semi"');
        expect(body).toContain('placeholder="输入"');
        expect(body).not.toContain('role="listbox"');
    });

    it('id 落在 input 上，根 div 带分流后的属性', () => {
        const { body } = render(AutoComplete, { props: { id: 'city', 'data-x': '1', class: 'own' } });
        expect(body).toMatch(/<input[^>]*id="city"/);
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toMatch(/<div[^>]*class="[^"]*own/);
    });
});
