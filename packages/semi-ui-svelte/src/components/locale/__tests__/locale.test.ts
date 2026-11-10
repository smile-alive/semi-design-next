import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { format } from 'date-fns';
import { de, enUS, zhCN } from 'date-fns/locale';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { en_US, zh_CN, type Locale, type LocaleInput } from '@fibrae/semi-ui-svelte/locale';
import type { LocaleComponentName, LocaleResult } from '../interface';
import AccessibleNames from './accessible-names.svelte';
import DateFnsLocale from './date-fns-locale.svelte';
import type { Layer } from './nest.svelte';
import NestedProbe from './nested-probe.svelte';
import Probe from './probe.svelte';
import RawCases from './raw-cases.svelte';
import Types from './types.svelte';

type Seen = (value: LocaleResult<Locale[LocaleComponentName]>) => void;

function setup(chain: Layer[], extra: { componentName?: LocaleComponentName; onSeen?: Seen } = {}) {
    const store = createStore({ chain, ...extra });
    render(NestedProbe, { props: { store } });
    return store;
}

const consumer = () => screen.getByTestId('consumer');
const hook = () => screen.getByTestId('hook');
const ja: LocaleInput = { code: 'ja-JP' };

describe('Svelte locale', () => {
    it('LocaleConsumer 与 useLocale 提供组件片段、code 与货币', () => {
        const onSeen = vi.fn<Seen>();
        setup([{ kind: 'locale', locale: en_US }], { onSeen });
        expect(onSeen).toHaveBeenLastCalledWith({
            locale: en_US.Modal,
            localeCode: 'en-US',
            currency: 'USD',
        });
        expect(hook().textContent).toBe(consumer().textContent);
    });

    it('没有任何 provider 时回退到 zh_CN', () => {
        const onSeen = vi.fn<Seen>();
        render(Probe, { props: { onSeen } });
        expect(onSeen).toHaveBeenCalledWith({
            locale: zh_CN.Modal,
            localeCode: 'zh-CN',
            currency: 'CNY',
        });
    });

    it('LocaleConsumer 的片段类型由 componentName 确定（类型由 svelte-check 校验）', () => {
        render(Types);
        expect(document.body).toHaveTextContent(`${zh_CN.Table.emptyText} CNY zh-CN`);
    });

    it('ConfigProvider 的 locale 优先于 LocaleProvider', () => {
        setup([
            { kind: 'locale', locale: zh_CN },
            { kind: 'config', locale: en_US },
        ]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('不带 locale 的 ConfigProvider 允许内部 LocaleProvider 生效', () => {
        setup([{ kind: 'config' }, { kind: 'locale', locale: en_US }]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('不带 locale 且没有 LocaleProvider 的 ConfigProvider 回退到 zh_CN', () => {
        setup([{ kind: 'config' }]);
        expect(consumer()).toHaveTextContent('"localeCode":"zh-CN"');
    });

    it('嵌套不带 locale 的 ConfigProvider 继承外层，优先于 LocaleProvider', () => {
        setup([{ kind: 'config', locale: en_US }, { kind: 'config' }, { kind: 'locale', locale: zh_CN }]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('Config.locale=null 清除继承，允许 LocaleProvider 生效', () => {
        setup([
            { kind: 'config', locale: zh_CN },
            { kind: 'config', locale: null },
            { kind: 'locale', locale: en_US },
        ]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('没有 code 的 locale 整体回退到 zh_CN', () => {
        setup([{ kind: 'locale', locale: { ...en_US, code: '' } }]);
        expect(consumer()).toHaveTextContent('"localeCode":"zh-CN"');
        expect(consumer()).toHaveTextContent('"currency":"CNY"');
    });

    it('日期组件按语言代码取内置的 date-fns 语言，其他语言用 enUS，ConfigProvider 的 dateFnsLocale 优先', () => {
        const displayValue = new Date(2026, 9, 13);
        const label = (locale: typeof de) => format(displayValue, 'PPP', { locale });
        render(DateFnsLocale, { props: { displayValue } });
        expect(screen.getAllByRole('table').map((table) => table.getAttribute('aria-label'))).toEqual([label(zhCN), label(enUS), label(de)]);
    });

    it('LocaleProvider 缺省、undefined 与 null 都继承，最外层不注入默认语言', () => {
        const onSeen = vi.fn<(locale: LocaleInput | null) => void>();
        render(RawCases, { props: { locale: en_US, onSeen } });
        expect(onSeen.mock.calls.map(([locale]) => locale?.code ?? null)).toEqual([null, en_US.code, en_US.code, en_US.code, null]);
    });

    it('嵌套不带 locale 时沿用外层语言，父级切换会响应更新', () => {
        const store = setup([{ kind: 'locale', locale: ja }, { kind: 'locale' }]);
        expect(consumer()).toHaveTextContent('"localeCode":"ja-JP"');
        store.chain = [{ kind: 'locale', locale: en_US }, { kind: 'locale' }];
        flushSync();
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
        expect(hook().textContent).toBe(consumer().textContent);
        store.chain = [{ kind: 'locale' }, { kind: 'locale' }];
        flushSync();
        expect(consumer()).toHaveTextContent('"localeCode":"zh-CN"');
    });

    it('ConfigProvider 切换语言时 useLocale 与 LocaleConsumer 同步更新', () => {
        const store = setup([
            { kind: 'config', locale: en_US },
            { kind: 'locale', locale: ja },
        ]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
        store.chain = [{ kind: 'config' }, { kind: 'locale', locale: ja }];
        flushSync();
        expect(consumer()).toHaveTextContent('"localeCode":"ja-JP"');
        expect(hook().textContent).toBe(consumer().textContent);
    });

    it('componentName 变化时 useLocale 与 LocaleConsumer 同步切换片段', () => {
        const store = setup([], {});
        expect(hook()).toHaveTextContent(zh_CN.Modal.confirm);
        store.componentName = 'Table';
        flushSync();
        expect(hook()).toHaveTextContent(zh_CN.Table.emptyText);
        expect(hook().textContent).toBe(consumer().textContent);
    });
});

describe('Svelte 可访问名称跟随语言包', () => {
    it('Spin 使用语言包名称，语言切换与 ConfigProvider 优先级即时生效', () => {
        expect(en_US.Spin.loading).not.toBe(zh_CN.Spin.loading);
        const store = createStore<{ locale?: Locale; configLocale?: Locale | null }>({ locale: en_US });
        render(AccessibleNames, { props: { store } });
        expect(screen.getByRole('status', { name: en_US.Spin.loading })).toBeInTheDocument();
        store.configLocale = zh_CN;
        flushSync();
        expect(screen.getByRole('status', { name: zh_CN.Spin.loading })).toBeInTheDocument();
        store.configLocale = null;
        flushSync();
        expect(screen.getByRole('status', { name: en_US.Spin.loading })).toBeInTheDocument();
    });
});
