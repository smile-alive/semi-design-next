/** @jsxImportSource vue */
import { defineComponent, ref, useTemplateRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useFocusHandover from '../use-focus-handover';

// "more" removes itself on click and reveals the items, like an expanding breadcrumb
const Expander = defineComponent({
    props: { moveFocus: Boolean },
    setup(props) {
        const expanded = ref(false);
        const list = useTemplateRef<HTMLUListElement>('list');
        const other = useTemplateRef<HTMLButtonElement>('other');
        const handover = useFocusHandover(() => list.value?.querySelector('a'));
        const expand = () => {
            if (props.moveFocus) {
                other.value?.focus();
            }
            expanded.value = true;
        };
        return () => (
            <>
                <button ref="other">other</button>
                <ul ref="list">
                    {expanded.value ? (
                        <li>
                            <a href="#b">b</a>
                        </li>
                    ) : (
                        <li>
                            <button ref={handover} onClick={expand}>
                                more
                            </button>
                        </li>
                    )}
                </ul>
            </>
        );
    },
});

describe('useFocusHandover', () => {
    it('持焦按钮被移除后，焦点交给同一次更新中挂载的目标', async () => {
        render(Expander);
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
    });

    it('处理函数已把焦点移到别处时不抢回', async () => {
        render(Expander, { props: { moveFocus: true } });
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        expect(screen.getByRole('button', { name: 'other' })).toHaveFocus();
    });

    it('重新渲染但节点仍在时焦点不变', async () => {
        const view = render(Expander);
        screen.getByRole('button', { name: 'more' }).focus();
        await view.rerender({ moveFocus: true });
        expect(screen.getByRole('button', { name: 'more' })).toHaveFocus();
    });
});
