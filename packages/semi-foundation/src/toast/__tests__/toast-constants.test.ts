import { describe, expect, it } from 'vite-plus/test';
import { builtInOpts, getStackLayerTransform, setPosition } from '../constants';

describe('Toast 的 setPosition', () => {
    it('数字加 px，字符串原样写入', () => {
        const wrapper = document.createElement('div');
        setPosition(wrapper, { top: 10, left: '5%' });
        expect(wrapper.style.top).toBe('10px');
        expect(wrapper.style.left).toBe('5%');
    });

    it('未出现的位置不写入，值为 undefined 时清除已有值', () => {
        const wrapper = document.createElement('div');
        wrapper.style.right = '3px';
        wrapper.style.bottom = '4px';
        setPosition(wrapper, { right: undefined });
        expect(wrapper.style.right).toBe('');
        expect(wrapper.style.bottom).toBe('4px');
    });
});

describe('getStackLayerTransform', () => {
    it('每有一条更新的 Toast 在前，就后退 10px；最新的一条与无位置时为 0', () => {
        expect(getStackLayerTransform({ index: 0, length: 3 })).toBe('translate3d(0,0,-20px)');
        expect(getStackLayerTransform({ index: 2, length: 3 })).toBe('translate3d(0,0,0px)');
        expect(getStackLayerTransform()).toBe('translate3d(0,0,0px)');
    });
});

describe('Toast 的 builtInOpts', () => {
    it('默认开启动画，zIndex 为 1010', () => {
        expect(builtInOpts).toEqual({ motion: true, zIndex: 1010, content: '' });
    });
});
