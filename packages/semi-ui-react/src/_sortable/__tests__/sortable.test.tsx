import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { ConfigProvider } from '@fibrae/semi-ui-react';
import { Sortable, type OnSortEnd } from '../index';

function List({ locale }: { locale: Locale }) {
    return (
        <ConfigProvider locale={locale}>
            <Sortable
                dragHandleLabel="drag"
                items={['a', 'b']}
                renderItem={({ id, sortableHandle }) => {
                    const Handle = sortableHandle(() => <span>drag</span>);
                    return (
                        <div>
                            <Handle />
                            <span>{id}</span>
                        </div>
                    );
                }}
                onSortEnd={vi.fn<OnSortEnd>()}
            />
        </ConfigProvider>
    );
}

const instructions = () => {
    const id = screen.getAllByRole('button', { name: 'drag' })[0].getAttribute('aria-describedby');
    return id ? document.getElementById(id)?.textContent : undefined;
};

describe('Sortable', () => {
    it('切换语言后，拖拽手柄的键盘说明随之更新', async () => {
        const { rerender } = render(<List locale={zh_CN} />);
        await waitFor(() => expect(instructions()).toBe(zh_CN.Sortable.instructions));
        rerender(<List locale={en_US} />);
        await waitFor(() => expect(instructions()).toBe(en_US.Sortable.instructions));
    });
});
