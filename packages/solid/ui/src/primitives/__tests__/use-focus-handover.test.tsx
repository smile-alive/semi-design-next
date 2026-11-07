import { createSignal, Show } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import useFocusHandover from '../use-focus-handover';

// "more" removes itself on click and reveals the items, like an expanding breadcrumb
function Expander(props: { moveFocus?: boolean }) {
    const [expanded, setExpanded] = createSignal(false);
    let list: HTMLUListElement | undefined;
    let other: HTMLButtonElement | undefined;
    const handover = useFocusHandover<HTMLButtonElement>(() => list?.querySelector('a'));
    return (
        <>
            <button ref={(node) => (other = node)}>other</button>
            <ul ref={(node) => (list = node)}>
                <Show
                    when={expanded()}
                    fallback={
                        <li>
                            <button
                                ref={handover}
                                onClick={() => {
                                    if (props.moveFocus) {
                                        other?.focus();
                                    }
                                    setExpanded(true);
                                }}
                            >
                                more
                            </button>
                        </li>
                    }
                >
                    <li>
                        <a href="#b">b</a>
                    </li>
                </Show>
            </ul>
        </>
    );
}

describe('useFocusHandover', () => {
    it('持焦按钮被移除后，焦点交给同一次更新中挂载的目标', async () => {
        render(() => <Expander />);
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        await Promise.resolve();
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
    });

    it('处理函数已把焦点移到别处时不抢回', async () => {
        render(() => <Expander moveFocus />);
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        await Promise.resolve();
        expect(screen.getByRole('button', { name: 'other' })).toHaveFocus();
    });
});
