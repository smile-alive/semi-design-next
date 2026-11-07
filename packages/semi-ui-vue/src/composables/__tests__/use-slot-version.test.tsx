/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive, shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useSlotVersion from '../use-slot-version';

const Probe = defineComponent({
    setup(_, { slots }) {
        const version = useSlotVersion(slots);
        const own = shallowRef(0);
        return () => <button type="button" onClick={() => own.value++}>{`version ${version.value} own ${own.value}`}</button>;
    },
});

describe('useSlotVersion', () => {
    it('自身状态更新不变，换插槽函数或去掉插槽时递增', async () => {
        const state = shallowReactive<{ slots: Record<string, () => string> }>({ slots: { default: () => 'a' } });
        render(defineComponent(() => () => <Probe>{state.slots}</Probe>));
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('version 0 own 0');

        await userEvent.click(button);
        expect(button).toHaveTextContent('version 0 own 1');

        state.slots = { default: () => 'b' };
        await nextTick();
        expect(button).toHaveTextContent('version 1 own 1');

        state.slots = { default: state.slots.default, extra: () => 'c' };
        await nextTick();
        expect(button).toHaveTextContent('version 2 own 1');

        state.slots = {};
        await nextTick();
        expect(button).toHaveTextContent('version 3 own 1');

        await userEvent.click(button);
        expect(button).toHaveTextContent('version 3 own 2');
    });
});
