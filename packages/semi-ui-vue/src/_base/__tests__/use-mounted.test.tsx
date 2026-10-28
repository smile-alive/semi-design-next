/** @jsxImportSource vue */
import { defineComponent, nextTick } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useMounted from '../use-mounted';

const Probe = defineComponent({
    props: { seen: { type: Array as () => boolean[], required: true } },
    setup(props) {
        const mounted = useMounted();
        props.seen.push(mounted.value);
        return () => <span data-testid="text">{String(mounted.value)}</span>;
    },
});

describe('useMounted', () => {
    it('setup 中为 false，挂载后为 true', async () => {
        const seen: boolean[] = [];
        render(Probe, { props: { seen } });
        await nextTick();
        expect(seen).toEqual([false]);
        expect(screen.getByTestId('text')).toHaveTextContent('true');
    });
});
