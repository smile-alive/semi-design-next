/** @jsxImportSource vue */
import { type VNode } from 'vue';
import { enUS, zhCN } from 'date-fns/locale';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import ConfigProvider from '../../config-provider';
import type { LocaleComponentName, LocaleConsumerSlots, LocaleResult } from '../interface';
import LocaleConsumer from '../locale-consumer.vue';
import LocaleProvider from '../locale-provider.vue';
import useLocale from '../use-locale';
import Probe from './fixtures/probe.vue';
import RawProbe from './fixtures/raw-probe.vue';
import Types from './fixtures/types.vue';

function inLocale(locale: Locale | null | undefined, child: () => VNode): VNode {
    return <LocaleProvider locale={locale}>{{ default: child }}</LocaleProvider>;
}

function inConfig(locale: Locale | null | undefined, child: () => VNode): VNode {
    return <ConfigProvider locale={locale}>{{ default: child }}</ConfigProvider>;
}

describe('locale', () => {
    it('LocaleConsumer 与 composable 提供组件片段、code、date-fns 语言与货币', () => {
        const onSeen = vi.fn<(value: LocaleResult<Locale[LocaleComponentName]>) => void>();
        const view = render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <Probe onSeen={onSeen} /> },
        });
        expect(onSeen).toHaveBeenLastCalledWith({
            locale: en_US.Modal,
            localeCode: 'en-US',
            dateFnsLocale: enUS,
            currency: 'USD',
        });
        expect(view.getByTestId('hook').textContent).toBe(view.getByTestId('consumer').textContent);
    });

    it('没有任何 provider 时回退到 zh_CN', () => {
        const onSeen = vi.fn<(value: LocaleResult<Locale[LocaleComponentName]>) => void>();
        render(Probe, { props: { onSeen } });
        expect(onSeen).toHaveBeenCalledWith({
            locale: zh_CN.Modal,
            localeCode: 'zh-CN',
            dateFnsLocale: zhCN,
            currency: 'CNY',
        });
    });

    it('作用域插槽片段类型由 componentName 确定', () => {
        type Slot = NonNullable<LocaleConsumerSlots<'Table'>['default']>;
        expectTypeOf<Parameters<Slot>[0]['locale']>().toEqualTypeOf<Locale['Table']>();
        expectTypeOf<'code'>().not.toExtend<LocaleComponentName>();
        expectTypeOf<'Tabel'>().not.toExtend<LocaleComponentName>();
        const typeOnly = () => {
            // @ts-expect-error 'code' is not a component's strings
            useLocale('code');
            // @ts-expect-error 'currency' is not a component's strings
            useLocale('currency');
            // @ts-expect-error 'dateFnsLocale' is not a component's strings
            useLocale('dateFnsLocale');
            expectTypeOf(useLocale('Table').value.locale).toEqualTypeOf<Locale['Table']>();
        };
        expect(typeOnly).toBeTypeOf('function');
        const view = render(Types);
        expect(view.container.textContent).toContain(zh_CN.Table.emptyText);
    });

    it('ConfigProvider 的 locale 优先于 LocaleProvider', () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => inConfig(en_US, () => <Probe />) },
        });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
    });

    it('不带 locale 的 ConfigProvider 允许内部 LocaleProvider 生效', () => {
        const view = render(ConfigProvider, { slots: { default: () => inLocale(en_US, () => <Probe />) } });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
    });

    it('不带 locale 且没有 LocaleProvider 的 ConfigProvider 回退到 zh_CN', () => {
        const view = render(ConfigProvider, { slots: { default: () => <Probe /> } });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"zh-CN"');
    });

    it('嵌套不带 locale 的 ConfigProvider 继承外层，优先于 LocaleProvider', () => {
        const view = render(ConfigProvider, {
            props: { locale: en_US },
            slots: { default: () => inConfig(undefined, () => inLocale(ja_JP, () => <Probe />)) },
        });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
    });

    it('Config.locale=null 清除继承，允许 LocaleProvider 生效', () => {
        const view = render(ConfigProvider, {
            props: { locale: ja_JP },
            slots: { default: () => inConfig(null, () => inLocale(en_US, () => <Probe />)) },
        });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
    });

    it('没有 code 的 locale 整体回退到 zh_CN', () => {
        const view = render(LocaleProvider, {
            props: { locale: { ...en_US, code: '' } },
            slots: { default: () => <Probe /> },
        });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"zh-CN"');
        expect(view.getByTestId('consumer')).toHaveTextContent('"currency":"CNY"');
    });

    it('缺少 dateFnsLocale 时交给 date-fns 默认语言，不借用 zh_CN', () => {
        // Runtime locale packs may omit dateFnsLocale, which date-fns explicitly accepts.
        const locale = { ...en_US, dateFnsLocale: undefined } as unknown as Locale;
        const view = render(LocaleProvider, { props: { locale }, slots: { default: () => <Probe /> } });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
        expect(view.getByTestId('date')).toHaveTextContent('Tuesday');
    });

    it('LocaleProvider 缺省、undefined 与 null 都继承，最外层不注入默认语言', () => {
        const onSeen = vi.fn<(locale: Locale | null) => void>();
        const probe = () => <RawProbe onSeen={onSeen} />;
        render(LocaleProvider, { slots: { default: probe } });
        render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => [probe(), inLocale(undefined, probe), inLocale(null, probe)] },
        });
        render(RawProbe, { props: { onSeen } });
        expect(onSeen.mock.calls.map(([locale]) => locale)).toEqual([null, en_US, en_US, en_US, null]);
    });

    it('嵌套不带 locale 时沿用外层语言，父级切换会响应更新', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => inLocale(undefined, () => <Probe />) },
        });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"ja-JP"');
        await view.rerender({ locale: en_US });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
        expect(view.getByTestId('hook').textContent).toBe(view.getByTestId('consumer').textContent);
        await view.rerender({ locale: undefined });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"zh-CN"');
    });

    it('ConfigProvider 切换语言时 useLocale 与 LocaleConsumer 同步更新', async () => {
        const view = render(ConfigProvider, {
            props: { locale: en_US },
            slots: { default: () => inLocale(ja_JP, () => <Probe />) },
        });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
        await view.rerender({ locale: undefined });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"ja-JP"');
        expect(view.getByTestId('hook').textContent).toBe(view.getByTestId('consumer').textContent);
    });

    it('componentName 变化时 computed 与作用域插槽同步切换片段', async () => {
        const view = render(Probe);
        expect(view.getByTestId('hook')).toHaveTextContent(zh_CN.Modal.confirm);
        await view.rerender({ componentName: 'Table' });
        expect(view.getByTestId('hook')).toHaveTextContent(zh_CN.Table.emptyText);
        expect(view.getByTestId('hook').textContent).toBe(view.getByTestId('consumer').textContent);
    });

    it('Provider 与 Consumer 丢弃无根 DOM 的未声明属性', () => {
        const view = render(LocaleProvider, {
            attrs: { id: 'provider', class: 'external' },
            slots: {
                default: () => (
                    <LocaleConsumer componentName="Modal" id="consumer">
                        {{
                            default: () => <span>内容</span>,
                        }}
                    </LocaleConsumer>
                ),
            },
        });
        expect(view.container.querySelector('[id], .external')).toBeNull();
        expect(view.getByText('内容')).toBeInTheDocument();
    });
});
