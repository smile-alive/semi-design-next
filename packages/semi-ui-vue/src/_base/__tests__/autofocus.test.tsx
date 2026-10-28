/** @jsxImportSource vue */
import { defineComponent, nextTick, ref, withDirectives, type VNode } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { hasAutofocus, vAutofocus } from '../autofocus';

// The test renderer mounts into a detached node, so focus is only observable on content inserted later.
function setup(content: () => VNode) {
    const show = ref(false);
    const Host = defineComponent({ render: () => (show.value ? content() : null) });
    const view = render(Host);
    return async () => {
        show.value = true;
        await nextTick();
        return view;
    };
}

describe('vAutofocus', () => {
    it('挂载后原生元素获得焦点', async () => {
        const view = await setup(() => withDirectives(<input data-testid="field" />, [[vAutofocus]]))();
        expect(document.activeElement).toBe(view.getByTestId('field'));
    });

    it('值为 false 时不聚焦', async () => {
        await setup(() => withDirectives(<input />, [[vAutofocus, false]]))();
        expect(document.activeElement).toBe(document.body);
    });

    it('用在单根组件上时聚焦其根元素', async () => {
        const Inner = defineComponent({ render: () => <input data-testid="root" /> });
        const view = await setup(() => withDirectives(<Inner />, [[vAutofocus]]))();
        expect(document.activeElement).toBe(view.getByTestId('root'));
    });
});

describe('hasAutofocus', () => {
    it.each([
        [{ autofocus: '' }, true],
        [{ autofocus: true }, true],
        [{ autofocus: false }, false],
        [{}, false],
    ])('attrs 为 %o 时返回 %s', (attrs, expected) => {
        expect(hasAutofocus(attrs)).toBe(expected);
    });
});
