/** @jsxImportSource vue */
import { type VNode } from 'vue';
import { format } from 'date-fns';
import { de, enUS, zhCN } from 'date-fns/locale';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { en_US, zh_CN, type Locale, type LocaleInput } from '@fibrae/semi-ui-vue/locale';
import { render } from '@test/utils/vue';
import Calendar from '../../calendar';
import ConfigProvider from '../../config-provider';
import type { LocaleComponentName, LocaleConsumerSlots, LocaleResult } from '../interface';
import LocaleConsumer from '../locale-consumer.vue';
import LocaleProvider from '../locale-provider.vue';
import useLocale from '../use-locale';
import Probe from './fixtures/probe.vue';
import RawProbe from './fixtures/raw-probe.vue';
import Types from './fixtures/types.vue';

const ja: LocaleInput = { code: 'ja-JP' };

function inLocale(locale: LocaleInput | null | undefined, child: () => VNode): VNode {
    return <LocaleProvider locale={locale}>{{ default: child }}</LocaleProvider>;
}

function inConfig(locale: LocaleInput | null | undefined, child: () => VNode): VNode {
    return <ConfigProvider locale={locale}>{{ default: child }}</ConfigProvider>;
}

describe('locale', () => {
    it('LocaleConsumer 与 composable 提供组件片段、code 与货币', () => {
        const onSeen = vi.fn<(value: LocaleResult<Locale[LocaleComponentName]>) => void>();
        const view = render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <Probe onSeen={onSeen} /> },
        });
        expect(onSeen).toHaveBeenLastCalledWith({
            locale: en_US.Modal,
            localeCode: 'en-US',
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
            expectTypeOf(useLocale('Table').value.locale).toEqualTypeOf<Locale['Table']>();
        };
        expect(typeOnly).toBeTypeOf('function');
        const view = render(Types);
        expect(view.container.textContent).toContain(zh_CN.Table.emptyText);
    });

    it('ConfigProvider 的 locale 优先于 LocaleProvider', () => {
        const view = render(LocaleProvider, {
            props: { locale: zh_CN },
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
            slots: { default: () => inConfig(undefined, () => inLocale(zh_CN, () => <Probe />)) },
        });
        expect(view.getByTestId('consumer')).toHaveTextContent('"localeCode":"en-US"');
    });

    it('Config.locale=null 清除继承，允许 LocaleProvider 生效', () => {
        const view = render(ConfigProvider, {
            props: { locale: zh_CN },
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

    it('日期组件按语言代码取内置的 date-fns 语言，其他语言用 enUS，ConfigProvider 的 dateFnsLocale 优先', () => {
        const date = new Date(2026, 9, 13);
        const label = (locale: typeof de) => format(date, 'PPP', { locale });
        const calendar = () => <Calendar displayValue={date} mode="day" />;
        const view = render(() => (
            <div>
                {calendar()}
                {inLocale(ja, () => (
                    <div>
                        {calendar()}
                        <ConfigProvider dateFnsLocale={de}>{{ default: calendar }}</ConfigProvider>
                    </div>
                ))}
            </div>
        ));
        expect(view.getAllByRole('table').map((table) => table.getAttribute('aria-label'))).toEqual([label(zhCN), label(enUS), label(de)]);
    });

    it('LocaleProvider 缺省、undefined 与 null 都继承，最外层不注入默认语言', () => {
        const onSeen = vi.fn<(locale: LocaleInput | null) => void>();
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
            props: { locale: ja },
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
            slots: { default: () => inLocale(ja, () => <Probe />) },
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
