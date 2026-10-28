import { Component } from 'react';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import Modal from '@fibrae/semi-ui-react/modal';
import { LocaleContext } from '../context';
import LocaleConsumer from '../locale-consumer';
import LocaleProvider from '../locale-provider';
import useLocale, { type LocaleComponentName } from '../use-locale';

function Probe({ componentName = 'Modal' }: { componentName?: LocaleComponentName }) {
    return (
        <LocaleConsumer componentName={componentName}>
            {(componentLocale, localeCode, dateFnsLocale, currency) => (
                <span data-testid="probe">
                    {JSON.stringify({
                        componentLocale,
                        localeCode,
                        dateFns: dateFnsLocale?.code,
                        currency,
                    })}
                </span>
            )}
        </LocaleConsumer>
    );
}

const read = () => JSON.parse(screen.getByTestId('probe').textContent);

describe('locale', () => {
    it('LocaleConsumer 传递组件片段、code、date-fns 语言与货币', () => {
        render(
            <LocaleProvider locale={en_US}>
                <Probe />
            </LocaleProvider>
        );
        expect(read()).toEqual({
            componentLocale: en_US.Modal,
            localeCode: 'en-US',
            dateFns: enUS.code,
            currency: 'USD',
        });
    });

    it('没有任何 provider 时回退到 zh_CN', () => {
        render(<Probe />);
        expect(read()).toEqual({
            componentLocale: zh_CN.Modal,
            localeCode: 'zh-CN',
            dateFns: zhCN.code,
            currency: 'CNY',
        });
    });

    it('componentName 只接受组件名，children 的片段类型随 componentName 确定', () => {
        const seen = [];
        render(
            <>
                <LocaleConsumer componentName="Table">
                    {(table) => {
                        expectTypeOf(table).toEqualTypeOf<Locale['Table']>();
                        seen.push(table);
                        return null;
                    }}
                </LocaleConsumer>
                {/* @ts-expect-error not a component name */}
                <LocaleConsumer componentName="Tabel">{() => null}</LocaleConsumer>
                {/* @ts-expect-error the slice of Table is not the slice of Chat */}
                <LocaleConsumer componentName="Table">{(chat: Locale['Chat']) => chat.clearContext}</LocaleConsumer>
                {/* @ts-expect-error not a component's strings */}
                <LocaleConsumer componentName="code">{() => null}</LocaleConsumer>
            </>
        );
        expect(seen).toEqual([zh_CN.Table]);
    });

    it('ConfigProvider 的 locale 优先于 LocaleProvider', () => {
        render(
            <LocaleProvider locale={ja_JP}>
                <ConfigProvider locale={en_US}>
                    <Probe />
                </ConfigProvider>
            </LocaleProvider>
        );
        expect(read().localeCode).toBe('en-US');
    });

    it('不带 locale 的 ConfigProvider 会让其内部的 LocaleProvider 生效', () => {
        render(
            <ConfigProvider>
                <LocaleProvider locale={en_US}>
                    <Probe />
                </LocaleProvider>
            </ConfigProvider>
        );
        expect(read().localeCode).toBe('en-US');
    });

    it('不带 locale 且没有 LocaleProvider 的 ConfigProvider 回退到 zh_CN', () => {
        render(
            <ConfigProvider>
                <Probe />
            </ConfigProvider>
        );
        expect(read()).toEqual({
            componentLocale: zh_CN.Modal,
            localeCode: 'zh-CN',
            dateFns: zhCN.code,
            currency: 'CNY',
        });
    });

    it('嵌套且不带 locale 的 ConfigProvider 继承外层 locale，优先于 LocaleProvider', () => {
        render(
            <ConfigProvider locale={en_US}>
                <ConfigProvider timeZone={8}>
                    <LocaleProvider locale={ja_JP}>
                        <Probe />
                    </LocaleProvider>
                </ConfigProvider>
            </ConfigProvider>
        );
        expect(read().localeCode).toBe('en-US');
    });

    it('locale={null} 的 ConfigProvider 清除继承的 locale，并让 LocaleProvider 生效', () => {
        render(
            <ConfigProvider locale={ja_JP}>
                <ConfigProvider locale={null}>
                    <LocaleProvider locale={en_US}>
                        <Probe />
                    </LocaleProvider>
                </ConfigProvider>
            </ConfigProvider>
        );
        expect(read().localeCode).toBe('en-US');
    });

    it('没有 code 的 locale 整体回退到 zh_CN', () => {
        render(
            <LocaleProvider locale={{ ...en_US, code: '' }}>
                <Probe />
            </LocaleProvider>
        );
        expect(read()).toEqual({
            componentLocale: zh_CN.Modal,
            localeCode: 'zh-CN',
            dateFns: zhCN.code,
            currency: 'CNY',
        });
    });

    it('没有 dateFnsLocale 的 locale 交给 date-fns 默认语言（enUS），不借用 zh_CN', () => {
        function Reader() {
            const { localeCode, dateFnsLocale } = useLocale('DatePicker');
            return <span>{`${localeCode} ${format(new Date(2026, 9, 13), 'EEEE', { locale: dateFnsLocale })}`}</span>;
        }
        render(
            <LocaleProvider locale={{ ...en_US, dateFnsLocale: undefined }}>
                <Reader />
            </LocaleProvider>
        );
        expect(screen.getByText(/^en-US /)).toHaveTextContent('en-US Tuesday');
    });

    it('不传 locale 的 LocaleProvider 继承外层，最外层时不提供语言包', () => {
        const seen = [];
        class ClassReader extends Component {
            static override contextType = LocaleContext;
            override render() {
                seen.push(this.context);
                return null;
            }
        }
        render(
            <>
                <LocaleProvider>
                    <ClassReader />
                </LocaleProvider>
                <LocaleProvider locale={en_US}>
                    <ClassReader />
                    <LocaleProvider>
                        <ClassReader />
                    </LocaleProvider>
                    <LocaleProvider locale={undefined}>
                        <ClassReader />
                    </LocaleProvider>
                </LocaleProvider>
                <ClassReader />
            </>
        );
        expect(seen).toEqual([undefined, en_US, en_US, en_US, undefined]);
    });

    it('嵌套且不传 locale 的 LocaleProvider 内，组件沿用外层语言', () => {
        render(
            <LocaleProvider locale={ja_JP}>
                <LocaleProvider>
                    <Probe />
                </LocaleProvider>
            </LocaleProvider>
        );
        expect(read()).toMatchObject({ componentLocale: ja_JP.Modal, localeCode: 'ja-JP' });
    });

    it('useLocale 的解析方式与 LocaleConsumer 一致', () => {
        let result;
        const onRender = (value) => (result = value);
        function Reader() {
            onRender(useLocale('Modal'));
            return null;
        }
        const { rerender } = render(
            <LocaleProvider locale={ja_JP}>
                <ConfigProvider locale={en_US}>
                    <Reader />
                </ConfigProvider>
            </LocaleProvider>
        );
        expect(result).toEqual({
            locale: en_US.Modal,
            localeCode: 'en-US',
            dateFnsLocale: enUS,
            currency: 'USD',
        });
        rerender(<Reader />);
        expect(result).toEqual({ locale: zh_CN.Modal, localeCode: 'zh-CN', dateFnsLocale: zhCN, currency: 'CNY' });
    });

    it('useLocale 只接受存放组件文案的键', () => {
        const TypeOnly = () => {
            // @ts-expect-error 'code' is not a component's strings
            useLocale('code');
            // @ts-expect-error 'currency' is not a component's strings
            useLocale('currency');
            // @ts-expect-error 'dateFnsLocale' is not a component's strings
            useLocale('dateFnsLocale');
            expectTypeOf(useLocale('Table').locale).toEqualTypeOf<Locale['Table']>();
        };
        expect(TypeOnly).toBeTypeOf('function');
    });

    it('可以传递到使用 LocaleConsumer 的 class 组件', () => {
        render(
            <LocaleProvider locale={en_US}>
                <Modal title="t" motion={false} visible>
                    body
                </Modal>
            </LocaleProvider>
        );
        expect(document.querySelector('[x-semi-prop="okText"]')).toHaveTextContent(/^Confirm$/);
        expect(document.querySelector('[x-semi-prop="cancelText"]')).toHaveTextContent(/^Cancel$/);
    });
});
