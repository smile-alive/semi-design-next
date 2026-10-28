/** @jsxImportSource vue */
import { KeepAlive, defineComponent, type PropType } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import HotKeys from '../index';

const Host = defineComponent({
    props: {
        active: { type: Boolean, required: true },
        onHotKey: { type: Function as PropType<(event: KeyboardEvent) => void>, required: true },
    },
    setup: (props) => () => <KeepAlive>{props.active ? <HotKeys hotKeys={['Control', 'k']} onHotKey={props.onHotKey} /> : <p>other</p>}</KeepAlive>,
});

const press = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'KeyK', ctrlKey: true, key: 'k' }));

describe('HotKeys KeepAlive', () => {
    it('失活后不响应全局快捷键，激活后恢复', async () => {
        const onHotKey = vi.fn<(event: KeyboardEvent) => void>();
        const view = render(Host, { props: { active: true, onHotKey } });
        press();
        expect(onHotKey).toHaveBeenCalledTimes(1);

        await view.rerender({ active: false, onHotKey });
        press();
        expect(onHotKey).toHaveBeenCalledTimes(1);

        await view.rerender({ active: true, onHotKey });
        press();
        expect(onHotKey).toHaveBeenCalledTimes(2);
    });
});
