import { describe, expect, it } from 'vite-plus/test';
import { buttonClassList, colorfulFill, groupLineClass, inheritGroupLooks, isAILoading, markEnds, paddingSides, resolveButtonLooks } from '../utils';

describe('resolveButtonLooks', () => {
    it('按 own、group、global、内置默认的顺序取值', () => {
        expect(resolveButtonLooks({ type: 'danger' }, { type: 'tertiary', theme: 'solid' }, { theme: 'outline', size: 'small' })).toEqual({
            disabled: false,
            size: 'small',
            type: 'danger',
            theme: 'solid',
            colorful: false,
        });
    });

    it('own 的 false 不被 group 覆盖', () => {
        expect(resolveButtonLooks({ disabled: false }, { disabled: true }, {}).disabled).toBe(false);
    });
});

describe('inheritGroupLooks', () => {
    it('未传的值取自外层 group', () => {
        expect(inheritGroupLooks({ size: 'large' }, { size: 'small', theme: 'borderless' })).toMatchObject({ size: 'large', theme: 'borderless' });
    });
});

describe('groupLineClass', () => {
    it('outline 没有分隔线', () => {
        expect(groupLineClass('semi-button', { theme: 'outline', type: 'primary', disabled: false })).toBeUndefined();
    });

    it('按 theme、type、disabled 生成类名', () => {
        expect(groupLineClass('semi-button', { theme: 'light', type: 'danger', disabled: true })).toBe('semi-button-group-line semi-button-group-line-light semi-button-group-line-danger semi-button-group-line-disabled');
    });
});

describe('buttonClassList', () => {
    const looks = { theme: 'solid', type: 'primary', size: 'large', disabled: false, colorful: true } as const;

    it('只包含生效的类名', () => {
        expect(buttonClassList('semi-button', looks, { block: true, withIcon: true, iconOnly: false, loading: false })).toEqual(['semi-button', 'semi-button-solid', 'semi-button-primary', 'semi-button-size-large', 'semi-button-block', 'semi-button-colorful', 'semi-button-with-icon']);
    });

    it('禁用时不带 type 类名，带 disabled 类名', () => {
        expect(buttonClassList('semi-button', { ...looks, disabled: true }, { block: false, withIcon: false, iconOnly: false, loading: false })).toContain('semi-button-primary-disabled');
    });
});

describe('paddingSides', () => {
    it.each([
        [true, ['left', 'right']],
        [['right'], ['right']],
        ['left', ['left']],
        [false, []],
        [undefined, []],
    ] as const)('%j', (value, expected) => {
        expect(paddingSides(value as never)).toEqual(expected);
    });
});

describe('isAILoading', () => {
    it('colorful 的非 solid 主题或 solid tertiary 使用 AI 图标', () => {
        expect(isAILoading('light', 'primary', true)).toBe(true);
        expect(isAILoading('solid', 'tertiary', false)).toBe(true);
        expect(isAILoading('solid', 'primary', true)).toBe(false);
    });
});

describe('colorfulFill', () => {
    it('禁用时统一为 disabled 色', () => {
        expect(colorfulFill('light', 'primary', true)).toEqual(Array(4).fill('var(--semi-color-disabled-text)'));
    });

    it('不支持的组合返回 undefined', () => {
        expect(colorfulFill('solid', 'danger', false)).toBeUndefined();
    });
});

describe('markEnds', () => {
    it('首尾按钮带 first、last，其余清除', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button class="semi-button-last"></button><span><button></button></span><button></button>';
        markEnds(container);
        const [a, b, c] = Array.from(container.querySelectorAll('button'));
        expect(a.className).toBe('semi-button-first');
        expect(b.className).toBe('');
        expect(c.className).toBe('semi-button-last');
    });
});
