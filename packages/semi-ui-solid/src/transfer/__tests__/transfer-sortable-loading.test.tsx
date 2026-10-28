import { render, screen } from '@solidjs/testing-library';
import { expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Transfer from '..';

// dnd-kit never finishes loading, so the stand-in list stays on screen
vi.mock('../../_sortable', () => new Promise(() => {}));

it('draggable 的占位手柄在 dnd-kit 加载完成前标为未就绪', () => {
    render(() => <Transfer defaultValue={['1']} dataSource={[{ label: 'item1', value: '1', key: 'a' }]} draggable />);
    expect(screen.getByRole('button', { name: zh_CN.Transfer.dragSort })).toHaveAttribute('aria-disabled', 'true');
});
