import { afterEach, describe, expect, it } from 'vite-plus/test';
import { findAnchorTarget } from '../utils';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('findAnchorTarget', () => {
    it('按 id 查找以 # 开头的链接，即使它不是合法的 selector', () => {
        document.body.innerHTML = '<h2 id="1-intro"></h2>';
        expect(findAnchorTarget(null, '#1-intro')).toBe(document.getElementById('1-intro'));
        expect(findAnchorTarget(null, '#')).toBeNull();
    });

    it('其余链接按 selector 查找，非法 selector 返回 null', () => {
        document.body.innerHTML = '<section class="docs"></section>';
        expect(findAnchorTarget(null, '.docs')).toBe(document.querySelector('.docs'));
        expect(findAnchorTarget(null, '??')).toBeNull();
    });

    it('在 root 所属的 shadow root 内查找', () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<div id="inner"></div><span id="start"></span>';
        document.body.insertAdjacentHTML('beforeend', '<div id="inner"></div>');
        expect(findAnchorTarget(shadow.getElementById('start'), '#inner')).toBe(shadow.getElementById('inner'));
    });
});
