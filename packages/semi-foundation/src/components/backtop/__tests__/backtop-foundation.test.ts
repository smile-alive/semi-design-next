import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import BackTopFoundation from '../foundation';

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('BackTopFoundation.warnInteractiveChildren', () => {
    it('按钮内含可交互元素时警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const button = document.createElement('button');
        button.innerHTML = '<a href="#top">top</a>';
        BackTopFoundation.warnInteractiveChildren(button);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi BackTop]'));
    });

    it('纯文本内容或没有按钮时不警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const button = document.createElement('button');
        button.innerHTML = '<span>top</span>';
        BackTopFoundation.warnInteractiveChildren(button);
        BackTopFoundation.warnInteractiveChildren(null);
        expect(warn).not.toHaveBeenCalled();
    });
});

describe('BackTopFoundation.onClick', () => {
    const setup = (duration: number) => {
        const props = { duration };
        const notifyClick = vi.fn<(e: unknown) => void>();
        const foundation = new BackTopFoundation({ getProps: () => props, notifyClick } as never);
        return { props, notifyClick, foundation };
    };

    it('按 duration 节流，窗口内的多次点击合并为一次补触发', () => {
        vi.useFakeTimers();
        const { notifyClick, foundation } = setup(300);
        foundation.onClick('a');
        foundation.onClick('b');
        foundation.onClick('c');
        expect(notifyClick.mock.calls).toEqual([['a']]);
        vi.advanceTimersByTime(300);
        expect(notifyClick.mock.calls).toEqual([['a'], ['c']]);
    });

    it('duration 变化后按新的间隔节流，并丢弃旧窗口的补触发', () => {
        vi.useFakeTimers();
        const { props, notifyClick, foundation } = setup(300);
        foundation.onClick('a');
        foundation.onClick('b');
        props.duration = 100;
        foundation.handlePropsChange();
        vi.advanceTimersByTime(1000);
        expect(notifyClick.mock.calls).toEqual([['a']]);
        foundation.onClick('c');
        foundation.onClick('d');
        vi.advanceTimersByTime(100);
        expect(notifyClick.mock.calls).toEqual([['a'], ['c'], ['d']]);
    });

    it('destroy 丢弃待执行的补触发', () => {
        vi.useFakeTimers();
        const { notifyClick, foundation } = setup(300);
        foundation.onClick('a');
        foundation.onClick('b');
        foundation.destroy();
        vi.advanceTimersByTime(1000);
        expect(notifyClick.mock.calls).toEqual([['a']]);
    });
});
