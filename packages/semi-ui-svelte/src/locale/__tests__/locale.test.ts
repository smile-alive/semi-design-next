import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { enUS, zhCN } from 'date-fns/locale';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { LocaleComponentName, LocaleResult } from '../interface';
import AccessibleNames from './accessible-names.svelte';
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

describe('Svelte locale', () => {
    it('LocaleConsumer 与 useLocale 提供组件片段、code、date-fns 语言与货币', () => {
        const onSeen = vi.fn<Seen>();
        setup([{ kind: 'locale', locale: en_US }], { onSeen });
        expect(onSeen).toHaveBeenLastCalledWith({
            locale: en_US.Modal,
            localeCode: 'en-US',
            dateFnsLocale: enUS,
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
            dateFnsLocale: zhCN,
            currency: 'CNY',
        });
    });

    it('LocaleConsumer 的片段类型由 componentName 确定（类型由 svelte-check 校验）', () => {
        render(Types);
        expect(document.body).toHaveTextContent(`${zh_CN.Table.emptyText} CNY zh-CN zh-CN`);
    });

    it('ConfigProvider 的 locale 优先于 LocaleProvider', () => {
        setup([
            { kind: 'locale', locale: ja_JP },
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
        setup([{ kind: 'config', locale: en_US }, { kind: 'config' }, { kind: 'locale', locale: ja_JP }]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('Config.locale=null 清除继承，允许 LocaleProvider 生效', () => {
        setup([
            { kind: 'config', locale: ja_JP },
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

    it('缺少 dateFnsLocale 时交给 date-fns 默认语言，不借用 zh_CN', () => {
        // Runtime locale packs may omit dateFnsLocale, which date-fns explicitly accepts.
        const locale = { ...en_US, dateFnsLocale: undefined } as unknown as Locale;
        setup([{ kind: 'locale', locale }]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
        expect(screen.getByTestId('date')).toHaveTextContent('Tuesday');
    });

    it('LocaleProvider 缺省、undefined 与 null 都继承，最外层不注入默认语言', () => {
        const onSeen = vi.fn<(locale: Locale | null) => void>();
        render(RawCases, { props: { locale: en_US, onSeen } });
        expect(onSeen.mock.calls.map(([locale]) => locale?.code ?? null)).toEqual([null, en_US.code, en_US.code, en_US.code, null]);
    });

    it('嵌套不带 locale 时沿用外层语言，父级切换会响应更新', () => {
        const store = setup([{ kind: 'locale', locale: ja_JP }, { kind: 'locale' }]);
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
            { kind: 'locale', locale: ja_JP },
        ]);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
        store.chain = [{ kind: 'config' }, { kind: 'locale', locale: ja_JP }];
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
    it('Spin 使用日语名称，语言切换与 ConfigProvider 优先级即时生效', () => {
        expect(ja_JP.Spin.loading).not.toBe(en_US.Spin.loading);
        const store = createStore<{ locale?: Locale; configLocale?: Locale | null }>({ locale: ja_JP });
        render(AccessibleNames, { props: { store } });
        expect(screen.getByRole('status', { name: ja_JP.Spin.loading })).toBeInTheDocument();
        store.configLocale = en_US;
        flushSync();
        expect(screen.getByRole('status', { name: en_US.Spin.loading })).toBeInTheDocument();
        store.configLocale = null;
        flushSync();
        expect(screen.getByRole('status', { name: ja_JP.Spin.loading })).toBeInTheDocument();
    });
});
