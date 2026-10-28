import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import BackTopFoundation from '../foundation';

afterEach(() => {
    vi.restoreAllMocks();
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
