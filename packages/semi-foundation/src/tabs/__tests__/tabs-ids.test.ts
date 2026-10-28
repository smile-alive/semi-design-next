import { describe, expect, it } from 'vite-plus/test';
import { getPanelId, getTabId } from '../constants';

describe('Tabs 的 tab 与 panel id', () => {
    it('由 tabs id 与 itemKey 组成', () => {
        expect(getTabId('t1', 'a')).toBe('t1-tab-a');
        expect(getPanelId('t1', 'a')).toBe('t1-panel-a');
    });

    it('itemKey 中的空格被编码，不会拆成多个 IDREF', () => {
        expect(getTabId('t1', 'a b')).toBe('t1-tab-a%20b');
        expect(getPanelId('t1', 'a b')).toBe('t1-panel-a%20b');
    });
});
