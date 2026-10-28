import { describe, expect, it } from 'vite-plus/test';
import { defaultResponsiveMap } from '../../grid/constants';
import en_US from '../../locale/source/en_US';
import { inheritConfig, switchesDirection } from '../inherit-config';

describe('inheritConfig', () => {
    it('自身值不是 undefined 就用自身值，否则用外层值', () => {
        const getPopupContainer = () => document.body;
        const responsiveMap = { ...defaultResponsiveMap, xs: 'a' };
        const result = inheritConfig({ timeZone: 8 }, { timeZone: 0, locale: en_US, getPopupContainer, responsiveMap });
        expect(result.timeZone).toBe(8);
        expect(result.locale).toBe(en_US);
        expect(result.getPopupContainer).toBe(getPopupContainer);
        expect(result.responsiveMap).toBe(responsiveMap);
    });

    it('locale 为 null 时清除外层的 locale', () => {
        expect(inheritConfig({ locale: null }, { locale: en_US }).locale).toBeNull();
    });

    it('direction 缺省为 ltr，responsiveObserve 缺省为 false', () => {
        expect(inheritConfig({}, {})).toMatchObject({ direction: 'ltr', responsiveObserve: false });
        expect(inheritConfig({}, { direction: 'rtl', responsiveObserve: true })).toMatchObject({ direction: 'rtl', responsiveObserve: true });
        expect(inheritConfig({ responsiveObserve: false }, { responsiveObserve: true }).responsiveObserve).toBe(false);
    });
});

describe('switchesDirection', () => {
    it('只有自身显式设置且与外层不同时才切换', () => {
        expect(switchesDirection({ direction: 'rtl' }, { direction: 'ltr' })).toBe(true);
        expect(switchesDirection({ direction: 'rtl' }, { direction: 'rtl' })).toBe(false);
        expect(switchesDirection({}, { direction: 'rtl' })).toBe(false);
    });

    it('外层没有 direction 时，显式的 ltr 也算切换', () => {
        expect(switchesDirection({ direction: 'ltr' }, {})).toBe(true);
    });
});
