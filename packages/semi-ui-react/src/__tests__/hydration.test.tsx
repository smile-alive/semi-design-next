import { StrictMode, useState, type ReactElement } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { hydrateFromServer } from '@test/utils/react';
import { Avatar, Calendar, Feedback, Image, ImagePreview, Modal, SideSheet, Table, Transfer, UserGuide } from '../index';
import { ssrCases } from './ssr-cases';

// jsdom has no Worker, so the editor core is faked as in json-viewer.test.tsx; the server HTML has no editor anyway
vi.mock('@fibrae/semi-json-viewer-core', () => ({
    JsonViewer: class {
        emitter = { on: () => {} };
        layout() {}
        dispose() {}
        getModel() {
            return { getValue: () => '' };
        }
        getSearchWidget() {
            return { search: () => {}, clear: () => {}, searchResults: [] };
        }
    },
}));

const image = 'https://localhost/a.png';

function fireImageEvent(container: HTMLElement, type: 'load' | 'error') {
    const img = container.querySelector('img');
    if (!img) {
        throw new Error('expected an img in the server HTML');
    }
    // A finished image: React only listens during hydration, so components must read this state themselves
    Object.defineProperty(img, 'complete', { value: true });
    Object.defineProperty(img, 'naturalWidth', { value: type === 'load' ? 100 : 0 });
    img.dispatchEvent(new Event(type));
}

describe('hydration 无告警与错误', () => {
    it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', async (_, { element }) => {
        const { errors } = await hydrateFromServer(element());
        expect(errors).toEqual([]);
    });
});

describe('默认打开的弹层在 hydration 后出现', () => {
    it.each(ssrCases.flatMap(({ name, element, opened }) => (opened ? [[name, element, opened] as const] : [])))('%s', async (_, element, opened) => {
        const { errors } = await hydrateFromServer(element());
        expect(await screen.findAllByRole(opened)).not.toHaveLength(0);
        expect(errors).toEqual([]);
    });
});

describe('默认打开的弹层在 hydration 后可用', () => {
    // the third item: whether the dialog is modal; Feedback's popup mode has no mask and never is
    const cases: [string, (onCancel: () => void) => ReactElement, boolean][] = [
        [
            'side-sheet',
            (onCancel) => (
                <SideSheet title="t" closeOnEsc visible onCancel={onCancel}>
                    <button type="button">inside</button>
                </SideSheet>
            ),
            true,
        ],
        ['image-preview', (onCancel) => <ImagePreview src={[image]} visible onVisibleChange={(visible) => !visible && onCancel()} />, true],
        ['feedback 侧边栏', (onCancel) => <Feedback type="text" closeOnEsc visible onCancel={onCancel} />, false],
        ['feedback 弹窗', (onCancel) => <Feedback type="text" mode="modal" visible onCancel={onCancel} />, true],
        [
            'modal',
            (onCancel) => (
                <Modal title="t" visible onCancel={onCancel}>
                    <button type="button">inside</button>
                </Modal>
            ),
            true,
        ],
        ['user-guide', (onCancel) => <UserGuide mode="modal" steps={[{ title: 'Step 1', description: 'd' }]} visible onSkip={onCancel} />, true],
    ];

    it.each(cases)('%s：焦点进入对话框，Esc 关闭', async (_, renderElement, modal) => {
        const onCancel = vi.fn<() => void>();
        function Host() {
            const [open, setOpen] = useState(true);
            return open ? (
                renderElement(() => {
                    onCancel();
                    setOpen(false);
                })
            ) : (
                <span>closed</span>
            );
        }
        const { errors } = await hydrateFromServer(<Host />);
        const dialog = await waitFor(() => {
            const found = screen.getByRole('dialog');
            expect(found).toContainElement(document.activeElement as HTMLElement);
            return found;
        });
        // inBody is false on the server and turns true once hydrated, which makes the dialog modal
        expect(dialog.getAttribute('aria-modal') === 'true').toBe(modal);
        fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(errors).toEqual([]);
    });
});

describe('hydration 后才加载的交互', () => {
    it('Table resizable：服务端没有拖拽句柄，hydration 后出现', async () => {
        const handle = `.${BASE_CLASS_PREFIX}-table-resize-handle`;
        const { container, errors } = await hydrateFromServer(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 120 }]} dataSource={[{ key: '1', name: 'a' }]} pagination={false} resizable />, (server) => {
            expect(server.querySelector(handle)).toBeNull();
        });
        await waitFor(() => expect(container.querySelector(handle)).not.toBeNull());
        expect(errors).toEqual([]);
    });

    it('Transfer draggable：服务端的拖拽句柄不可用，hydration 后可用', async () => {
        const transferData = [
            { key: 'a', label: 'Alpha', value: 'a' },
            { key: 'b', label: 'Bravo', value: 'b' },
        ];
        const handle = `.${BASE_CLASS_PREFIX}-transfer-right-item-drag-handler`;
        const { container, errors } = await hydrateFromServer(<Transfer value={['a', 'b']} dataSource={transferData} draggable />, (server) => {
            expect(server.querySelector(handle)).toHaveAttribute('aria-disabled', 'true');
        });
        await waitFor(() => expect(container.querySelector(handle)).not.toHaveAttribute('aria-disabled'));
        expect(errors).toEqual([]);
    });
});

// The server renders just before midnight and the client hydrates just after; both days are in view
describe('Calendar 跨日', () => {
    const serverNow = new Date(2026, 10, 1, 23, 59, 59);
    const clientNow = new Date(2026, 10, 2, 0, 0, 1);

    it.each(['month', 'week'] as const)('%s 视图：今天标记只在 hydration 后落在客户端的今天', async (mode) => {
        vi.setSystemTime(serverNow);
        const { container, errors } = await hydrateFromServer(<Calendar displayValue={new Date(2026, 10, 4)} mode={mode} showCurrTime />, (server) => {
            expect(server.querySelector('[aria-current="date"]')).toBeNull();
            vi.setSystemTime(clientNow);
        });
        expect(errors).toEqual([]);
        await waitFor(() => expect(container.querySelectorAll('[aria-current="date"]')).toHaveLength(1));
        expect(within(container.querySelector<HTMLElement>('[aria-current="date"]')).getByText('2')).toBeInTheDocument();
    });

    it('day 视图：当前时间线只在 hydration 后出现', async () => {
        const currLine = `.${BASE_CLASS_PREFIX}-calendar-grid-curr-line`;
        vi.setSystemTime(serverNow);
        const { container, errors } = await hydrateFromServer(<Calendar displayValue={clientNow} mode="day" showCurrTime />, (server) => {
            expect(server.querySelector(currLine)).toBeNull();
            vi.setSystemTime(clientNow);
        });
        expect(errors).toEqual([]);
        await waitFor(() => expect(container.querySelector(currLine)).not.toBeNull());
    });
});

describe('hydration 前已完成的图片事件', () => {
    it('Image 加载完成后可打开预览', async () => {
        const { container, errors } = await hydrateFromServer(<Image alt="a" height={100} src={image} width={100} />, (server) => fireImageEvent(server, 'load'));
        expect(errors).toEqual([]);
        await waitFor(() => expect(container.querySelector(`.${BASE_CLASS_PREFIX}-image-img-preview`)).not.toBeNull());
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-image-overlay`)).toBeNull();
    });

    it('Image 加载失败后显示回退内容', async () => {
        const { container, errors } = await hydrateFromServer(<Image alt="a" fallback={<span>fallback</span>} height={100} src={image} width={100} />, (server) => fireImageEvent(server, 'error'));
        expect(errors).toEqual([]);
        await waitFor(() => expect(container).toHaveTextContent('fallback'));
    });

    it('Avatar 加载失败后显示文字', async () => {
        const { container, errors } = await hydrateFromServer(
            <Avatar alt="a" src={image}>
                SD
            </Avatar>,
            (server) => fireImageEvent(server, 'error')
        );
        expect(errors).toEqual([]);
        await waitFor(() => expect(container.querySelector('img')).toBeNull());
        expect(container).toHaveTextContent('SD');
    });

    it.each(['load', 'error'] as const)('StrictMode 下 Image 的 %s 只补发一次', async (type) => {
        const onLoad = vi.fn<() => void>();
        const onError = vi.fn<() => void>();
        const { errors } = await hydrateFromServer(
            <StrictMode>
                <Image alt="a" height={100} src={image} width={100} onError={onError} onLoad={onLoad} />
            </StrictMode>,
            (server) => fireImageEvent(server, type)
        );
        expect(errors).toEqual([]);
        await waitFor(() => expect(type === 'load' ? onLoad : onError).toHaveBeenCalled());
        expect(onLoad).toHaveBeenCalledTimes(type === 'load' ? 1 : 0);
        expect(onError).toHaveBeenCalledTimes(type === 'error' ? 1 : 0);
    });

    it('StrictMode 下 Avatar 的 error 只补发一次', async () => {
        const onError = vi.fn<() => void>();
        const { errors } = await hydrateFromServer(
            <StrictMode>
                <Avatar alt="a" src={image} onError={onError}>
                    SD
                </Avatar>
            </StrictMode>,
            (server) => fireImageEvent(server, 'error')
        );
        expect(errors).toEqual([]);
        await waitFor(() => expect(onError).toHaveBeenCalled());
        expect(onError).toHaveBeenCalledTimes(1);
    });
});
