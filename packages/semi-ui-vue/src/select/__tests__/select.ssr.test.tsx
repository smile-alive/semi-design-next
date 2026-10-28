/** @jsxImportSource vue */
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import Select from '..';
import Shorthand from './fixtures/shorthand.vue';

it('受控值在服务端 HTML 中显示所选项的 label', async () => {
    const { html, warnings } = await renderOnServer(() => (
        <Select
            aria-label="水果"
            modelValue="b"
            motion={false}
            optionList={[
                { value: 'a', label: 'Apple' },
                { value: 'b', label: 'Banana' },
            ]}
        />
    ));
    expect(warnings).toEqual([]);
    expect(html).toMatch(/semi-select-selection-text[^>]*>(<!--\[-->)*Banana/);
});

// A single-root SFC compiled for the server merges attrs through mergeProps; a valueless attribute whose name starts
// with "on" would be dropped there, so the object defaultValue below would not resolve to its label
it('服务端编译的单根模板保留 changeWithObject 简写', async () => {
    const { html, warnings } = await renderOnServer(() => <Shorthand />);
    expect(warnings).toEqual([]);
    // the selection text holds the label; without the flag it would hold the stringified object
    expect(html).toMatch(/semi-select-selection-text[^>]*>(<!--\[-->)*Apple/);
});
