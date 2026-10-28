import { StrictMode, useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import useFocusHandover from '../use-focus-handover';

// "more" removes itself on click and reveals the items, like an expanding breadcrumb
function Expander({ moveFocus = false }: { moveFocus?: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const list = useRef<HTMLUListElement>(null);
    const other = useRef<HTMLButtonElement>(null);
    const handover = useFocusHandover<HTMLButtonElement>(() => list.current?.querySelector('a'));
    return (
        <>
            <button ref={other}>other</button>
            <ul ref={list}>
                {expanded && (
                    <li>
                        <a href="#b">b</a>
                    </li>
                )}
                {!expanded && (
                    <li>
                        <button
                            ref={handover}
                            onClick={() => {
                                if (moveFocus) {
                                    other.current?.focus();
                                }
                                setExpanded(true);
                            }}
                        >
                            more
                        </button>
                    </li>
                )}
            </ul>
            <button onClick={() => setExpanded(false)}>collapse</button>
        </>
    );
}

describe('useFocusHandover', () => {
    it('持焦按钮被移除后，焦点交给同一次提交中挂载的目标', async () => {
        render(<Expander />);
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
    });

    it('处理函数已把焦点移到别处时不抢回', async () => {
        render(<Expander moveFocus />);
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        expect(screen.getByRole('button', { name: 'other' })).toHaveFocus();
    });

    it('重新渲染但节点仍在时焦点不变', () => {
        const { rerender } = render(<Expander />);
        screen.getByRole('button', { name: 'more' }).focus();
        rerender(<Expander moveFocus />);
        expect(screen.getByRole('button', { name: 'more' })).toHaveFocus();
    });

    it('StrictMode 下挂载时的模拟卸载不移动焦点，之后照常交还', async () => {
        render(
            <StrictMode>
                <Expander />
            </StrictMode>
        );
        expect(document.activeElement).toBe(document.body);
        await userEvent.click(screen.getByRole('button', { name: 'more' }));
        expect(screen.getByRole('link', { name: 'b' })).toHaveFocus();
    });
});
