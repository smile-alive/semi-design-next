import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import useClickOutside from '../use-click-outside';

function Picker({ onOutside }: { onOutside: (e: MouseEvent) => void }) {
    const listRef = useRef<HTMLDivElement>(null);
    const [options, setOptions] = useState(['a', 'b']);
    useClickOutside([listRef], onOutside, true);
    return (
        <>
            <div ref={listRef}>
                {options.map((option) => (
                    // selecting removes the option in the same mousedown, before it reaches document
                    <button key={option} onMouseDown={() => setOptions((prev) => prev.filter((item) => item !== option))}>
                        {option}
                    </button>
                ))}
            </div>
            <button>outside</button>
        </>
    );
}

describe('useClickOutside', () => {
    it('在同一次 mousedown 中被移除的目标仍视为内部', async () => {
        const onOutside = vi.fn<(e: MouseEvent) => void>();
        const connected = [];
        const record = (e: MouseEvent) => connected.push((e.target as Node).isConnected);
        render(<Picker onOutside={onOutside} />);
        document.addEventListener('mousedown', record);
        await userEvent.click(screen.getByText('a'));
        document.removeEventListener('mousedown', record);

        expect(connected).toEqual([false]);
        expect(screen.queryByText('a')).toBeNull();
        expect(onOutside).not.toHaveBeenCalled();
    });

    it('外部 mousedown 会调用 onOutside', async () => {
        const onOutside = vi.fn<(e: MouseEvent) => void>();
        render(<Picker onOutside={onOutside} />);
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        expect(onOutside).toHaveBeenCalledTimes(1);
    });
});
