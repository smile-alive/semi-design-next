import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Counter from './fixtures/counter.vue';

describe('HotKeys', () => {
    it('基础用法', async () => {
        const view = render(Counter, { props: { mode: 'basic' } });
        await clickOutside();
        await userEvent.keyboard('{Control>}k{/Control}');
        expect(view.getByTestId('pre')).toHaveTextContent('1');
    });

    it('组合键', async () => {
        const view = render(Counter, { props: { mode: 'combo' } });
        await clickOutside();
        await userEvent.keyboard('{Meta>}{Alt>}k{/Alt}{/Meta}');
        await userEvent.keyboard('{Meta>}{Shift>}k{/Shift}{/Meta}');
        expect(view.getByTestId('pre')).toHaveTextContent('2');
    });

    it('目标元素', async () => {
        const view = render(Counter, { props: { mode: 'target' } });
        await userEvent.click(view.getByPlaceholderText('test for target'));
        await userEvent.keyboard('{Meta>}s{/Meta}');
        expect(view.getByTestId('pre')).toHaveTextContent('1');
    });
});
