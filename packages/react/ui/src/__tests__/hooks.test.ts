import { describe, expect, it } from 'vite-plus/test';
import { getBody, getDocument, getWindow } from '../hooks';

describe('hooks 入口', () => {
    it('导出全局事件目标的 getter', () => {
        expect(getDocument()).toBe(document);
        expect(getWindow()).toBe(window);
        expect(getBody()).toBe(document.body);
    });
});
