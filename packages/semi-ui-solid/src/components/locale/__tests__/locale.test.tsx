import { type Accessor, createEffect, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { format } from 'date-fns';
import { de, enUS, zhCN } from 'date-fns/locale';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { en_US, zh_CN, type Locale, type LocaleInput } from '@fibrae/semi-ui-solid/locale';
import Calendar from '../../calendar';
import ConfigProvider from '../../config-provider';
import { useLocaleContext } from '../context';
import { type LocaleComponentName, LocaleConsumer, type LocaleConsumerProps, LocaleProvider, type LocaleResult, useLocale } from '../index';

type AnyResult = LocaleResult<Locale[LocaleComponentName]>;

function Probe(props: { componentName?: LocaleComponentName; onSeen?: (value: AnyResult) => void }) {
    const name = () => props.componentName ?? 'Modal';
    const result = useLocale(name);
    createEffect(() => props.onSeen?.(result()));
    return (
        <>
            <span data-testid="hook">{JSON.stringify(result())}</span>
            <LocaleConsumer componentName={name()}>{(locale, localeCode, currency) => <span data-testid="consumer">{JSON.stringify({ locale, localeCode, currency })}</span>}</LocaleConsumer>
        </>
    );
}

function RawProbe(props: { onSeen: (locale: LocaleInput | null) => void }) {
    const locale = useLocaleContext();
    createEffect(() => props.onSeen(locale?.() ?? null));
    return null;
}

const consumer = () => screen.getByTestId('consumer');
const ja: LocaleInput = { code: 'ja-JP' };

describe('locale', () => {
    it('LocaleConsumer 与 useLocale 提供组件片段、code 与货币', () => {
        const onSeen = vi.fn<(value: AnyResult) => void>();
        render(() => (
            <LocaleProvider locale={en_US}>
                <Probe onSeen={onSeen} />
            </LocaleProvider>
        ));
        expect(onSeen).toHaveBeenLastCalledWith({
            locale: en_US.Modal,
            localeCode: 'en-US',
            currency: 'USD',
        });
        expect(screen.getByTestId('hook').textContent).toBe(consumer().textContent);
    });

    it('没有任何 provider 时回退到 zh_CN', () => {
        const onSeen = vi.fn<(value: AnyResult) => void>();
        render(() => <Probe onSeen={onSeen} />);
        expect(onSeen).toHaveBeenCalledWith({
            locale: zh_CN.Modal,
            localeCode: 'zh-CN',
            currency: 'CNY',
        });
        expect(screen.getByTestId('hook').textContent).toBe(consumer().textContent);
    });

    it('片段类型由 componentName 确定，只接受存放组件文案的键', () => {
        expectTypeOf<Parameters<LocaleConsumerProps<'Table'>['children']>[0]>().toEqualTypeOf<Locale['Table']>();
        expectTypeOf<ReturnType<typeof useLocale<'Table'>>>().toEqualTypeOf<Accessor<LocaleResult<Locale['Table']>>>();
        expectTypeOf<'code'>().not.toExtend<LocaleComponentName>();
        expectTypeOf<'currency'>().not.toExtend<LocaleComponentName>();
        expectTypeOf<'Tabel'>().not.toExtend<LocaleComponentName>();
        const view = render(() => (
            <LocaleConsumer componentName="Table">
                {(table, localeCode, currency) => (
                    <span>
                        {table.emptyText} {currency} {localeCode}
                    </span>
                )}
            </LocaleConsumer>
        ));
        expect(view.container).toHaveTextContent(`${zh_CN.Table.emptyText} CNY zh-CN`);
    });

    it('ConfigProvider 的 locale 优先于 LocaleProvider', () => {
        render(() => (
            <LocaleProvider locale={zh_CN}>
                <ConfigProvider locale={en_US}>
                    <Probe />
                </ConfigProvider>
            </LocaleProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('不带 locale 的 ConfigProvider 允许内部 LocaleProvider 生效', () => {
        render(() => (
            <ConfigProvider>
                <LocaleProvider locale={en_US}>
                    <Probe />
                </LocaleProvider>
            </ConfigProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('不带 locale 且没有 LocaleProvider 的 ConfigProvider 回退到 zh_CN', () => {
        render(() => (
            <ConfigProvider>
                <Probe />
            </ConfigProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"zh-CN"');
        expect(consumer()).toHaveTextContent('"currency":"CNY"');
    });

    it('嵌套不带 locale 的 ConfigProvider 继承外层，优先于 LocaleProvider', () => {
        render(() => (
            <ConfigProvider locale={en_US}>
                <ConfigProvider timeZone={8}>
                    <LocaleProvider locale={zh_CN}>
                        <Probe />
                    </LocaleProvider>
                </ConfigProvider>
            </ConfigProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('locale={null} 的 ConfigProvider 清除继承，允许 LocaleProvider 生效', () => {
        render(() => (
            <ConfigProvider locale={zh_CN}>
                <ConfigProvider locale={null}>
                    <LocaleProvider locale={en_US}>
                        <Probe />
                    </LocaleProvider>
                </ConfigProvider>
            </ConfigProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('没有 code 的 locale 整体回退到 zh_CN', () => {
        render(() => (
            <LocaleProvider locale={{ ...en_US, code: '' }}>
                <Probe />
            </LocaleProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"zh-CN"');
        expect(consumer()).toHaveTextContent('"currency":"CNY"');
    });

    it('日期组件按语言代码取内置的 date-fns 语言，其他语言用 enUS，ConfigProvider 的 dateFnsLocale 优先', () => {
        const date = new Date(2026, 9, 13);
        const label = (locale: typeof de) => format(date, 'PPP', { locale });
        render(() => (
            <>
                <Calendar displayValue={date} mode="day" />
                <LocaleProvider locale={ja}>
                    <Calendar displayValue={date} mode="day" />
                    <ConfigProvider dateFnsLocale={de}>
                        <Calendar displayValue={date} mode="day" />
                    </ConfigProvider>
                </LocaleProvider>
            </>
        ));
        expect(screen.getAllByRole('table').map((table) => table.getAttribute('aria-label'))).toEqual([label(zhCN), label(enUS), label(de)]);
    });

    it('LocaleProvider 缺省、undefined 与 null 都继承，最外层不注入默认语言', () => {
        const onSeen = vi.fn<(locale: LocaleInput | null) => void>();
        render(() => (
            <>
                <LocaleProvider>
                    <RawProbe onSeen={onSeen} />
                </LocaleProvider>
                <LocaleProvider locale={en_US}>
                    <RawProbe onSeen={onSeen} />
                    <LocaleProvider locale={undefined}>
                        <RawProbe onSeen={onSeen} />
                    </LocaleProvider>
                    <LocaleProvider locale={null}>
                        <RawProbe onSeen={onSeen} />
                    </LocaleProvider>
                </LocaleProvider>
                <RawProbe onSeen={onSeen} />
            </>
        ));
        expect(onSeen.mock.calls.map(([locale]) => locale)).toEqual([null, en_US, en_US, en_US, null]);
    });

    it('嵌套不带 locale 时沿用外层语言，父级切换会响应更新', () => {
        const [locale, setLocale] = createSignal<LocaleInput | undefined>(ja);
        render(() => (
            <LocaleProvider locale={locale()}>
                <LocaleProvider>
                    <Probe />
                </LocaleProvider>
            </LocaleProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"ja-JP"');
        setLocale(en_US);
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
        expect(screen.getByTestId('hook').textContent).toBe(consumer().textContent);
        setLocale(undefined);
        expect(consumer()).toHaveTextContent('"localeCode":"zh-CN"');
    });

    it('ConfigProvider 切换语言时 useLocale 与 LocaleConsumer 同步更新', () => {
        const [locale, setLocale] = createSignal<Locale | undefined>(en_US);
        render(() => (
            <ConfigProvider locale={locale()}>
                <LocaleProvider locale={ja}>
                    <Probe />
                </LocaleProvider>
            </ConfigProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
        setLocale(undefined);
        expect(consumer()).toHaveTextContent('"localeCode":"ja-JP"');
        expect(screen.getByTestId('hook').textContent).toBe(consumer().textContent);
    });

    it('与语言无关的配置变化不通知 useLocale，也不重建 LocaleConsumer 子树', () => {
        const [timeZone, setTimeZone] = createSignal<string | number>(8);
        const onSeen = vi.fn<(value: AnyResult) => void>();
        render(() => (
            <ConfigProvider locale={en_US} timeZone={timeZone()}>
                <Probe onSeen={onSeen} />
            </ConfigProvider>
        ));
        const node = consumer();
        setTimeZone(9);
        expect(onSeen).toHaveBeenCalledTimes(1);
        expect(consumer()).toBe(node);
    });

    it('componentName 变化时 useLocale 与 LocaleConsumer 同步切换片段', () => {
        const [name, setName] = createSignal<LocaleComponentName>('Modal');
        render(() => <Probe componentName={name()} />);
        expect(screen.getByTestId('hook')).toHaveTextContent(zh_CN.Modal.confirm);
        setName('Table');
        expect(screen.getByTestId('hook')).toHaveTextContent(zh_CN.Table.emptyText);
        expect(screen.getByTestId('hook').textContent).toBe(consumer().textContent);
    });

    it('Provider 与 Consumer 丢弃无根 DOM 的未声明属性', () => {
        const view = render(() => (
            <LocaleProvider {...{ id: 'provider', class: 'external' }}>
                <LocaleConsumer componentName="Modal" {...{ id: 'consumer' }}>
                    {() => <span>内容</span>}
                </LocaleConsumer>
            </LocaleProvider>
        ));
        expect(view.container.querySelector('[id], .external')).toBeNull();
        expect(screen.getByText('内容')).toBeInTheDocument();
    });
});
