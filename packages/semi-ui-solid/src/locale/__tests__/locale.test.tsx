import { type Accessor, createEffect, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import ConfigProvider from '../../config-provider';
import { useLocaleContext } from '../context';
import { type LocaleComponentName, LocaleConsumer, type LocaleConsumerProps, LocaleProvider, type LocaleResult, useLocale } from '../index';

type AnyResult = LocaleResult<Locale[LocaleComponentName]>;

const serialize = (value: AnyResult) => JSON.stringify({ ...value, dateFnsLocale: value.dateFnsLocale?.code });

function Probe(props: { componentName?: LocaleComponentName; onSeen?: (value: AnyResult) => void }) {
    const name = () => props.componentName ?? 'Modal';
    const result = useLocale(name);
    createEffect(() => props.onSeen?.(result()));
    return (
        <>
            <span data-testid="hook">{serialize(result())}</span>
            <LocaleConsumer componentName={name()}>{(locale, localeCode, dateFnsLocale, currency) => <span data-testid="consumer">{serialize({ locale, localeCode, dateFnsLocale, currency })}</span>}</LocaleConsumer>
        </>
    );
}

function RawProbe(props: { onSeen: (locale: Locale | null) => void }) {
    const locale = useLocaleContext();
    createEffect(() => props.onSeen(locale?.() ?? null));
    return null;
}

const consumer = () => screen.getByTestId('consumer');

describe('locale', () => {
    it('LocaleConsumer 与 useLocale 提供组件片段、code、date-fns 语言与货币', () => {
        const onSeen = vi.fn<(value: AnyResult) => void>();
        render(() => (
            <LocaleProvider locale={en_US}>
                <Probe onSeen={onSeen} />
            </LocaleProvider>
        ));
        expect(onSeen).toHaveBeenLastCalledWith({
            locale: en_US.Modal,
            localeCode: 'en-US',
            dateFnsLocale: en_US.dateFnsLocale,
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
            dateFnsLocale: zh_CN.dateFnsLocale,
            currency: 'CNY',
        });
        expect(screen.getByTestId('hook').textContent).toBe(consumer().textContent);
    });

    it('片段类型由 componentName 确定，只接受存放组件文案的键', () => {
        expectTypeOf<Parameters<LocaleConsumerProps<'Table'>['children']>[0]>().toEqualTypeOf<Locale['Table']>();
        expectTypeOf<ReturnType<typeof useLocale<'Table'>>>().toEqualTypeOf<Accessor<LocaleResult<Locale['Table']>>>();
        expectTypeOf<'code'>().not.toExtend<LocaleComponentName>();
        expectTypeOf<'currency'>().not.toExtend<LocaleComponentName>();
        expectTypeOf<'dateFnsLocale'>().not.toExtend<LocaleComponentName>();
        expectTypeOf<'Tabel'>().not.toExtend<LocaleComponentName>();
        const view = render(() => (
            <LocaleConsumer componentName="Table">
                {(table, localeCode, dateFnsLocale, currency) => (
                    <span>
                        {table.emptyText} {currency} {localeCode} {dateFnsLocale.code}
                    </span>
                )}
            </LocaleConsumer>
        ));
        expect(view.container).toHaveTextContent(`${zh_CN.Table.emptyText} CNY zh-CN ${zh_CN.dateFnsLocale.code}`);
    });

    it('ConfigProvider 的 locale 优先于 LocaleProvider', () => {
        render(() => (
            <LocaleProvider locale={ja_JP}>
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
                    <LocaleProvider locale={ja_JP}>
                        <Probe />
                    </LocaleProvider>
                </ConfigProvider>
            </ConfigProvider>
        ));
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
    });

    it('locale={null} 的 ConfigProvider 清除继承，允许 LocaleProvider 生效', () => {
        render(() => (
            <ConfigProvider locale={ja_JP}>
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

    it('缺少 dateFnsLocale 时保持 undefined 交给 date-fns 默认语言，不借用 zh_CN', () => {
        // Runtime locale packs may omit dateFnsLocale, which date-fns explicitly accepts.
        const locale = { ...en_US, dateFnsLocale: undefined } as unknown as Locale;
        const onSeen = vi.fn<(value: AnyResult) => void>();
        render(() => (
            <LocaleProvider locale={locale}>
                <Probe onSeen={onSeen} />
            </LocaleProvider>
        ));
        expect(onSeen).toHaveBeenLastCalledWith(expect.objectContaining({ localeCode: 'en-US', dateFnsLocale: undefined }));
        expect(consumer()).toHaveTextContent('"localeCode":"en-US"');
        expect(consumer()).not.toHaveTextContent('dateFnsLocale');
    });

    it('LocaleProvider 缺省、undefined 与 null 都继承，最外层不注入默认语言', () => {
        const onSeen = vi.fn<(locale: Locale | null) => void>();
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
        const [locale, setLocale] = createSignal<Locale | undefined>(ja_JP);
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
                <LocaleProvider locale={ja_JP}>
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
