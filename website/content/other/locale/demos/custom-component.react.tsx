import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import ko_KR from '@fibrae/semi-foundation/locale/source/ko_KR';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { LocaleProvider, LocaleConsumer } from '@fibrae/semi-ui-react';

// Custom component text joins the Locale type through declaration merging
declare module '@fibrae/semi-foundation/locale/interface' {
    interface Locale {
        ComponentA: { customKey: string };
    }
}

function GetLocaleFromSemi() {
    return (
        <LocaleConsumer componentName="TimePicker">
            {(localeData, localeCode) => (
                <div>
                    {localeCode} : {localeData.begin}
                </div>
            )}
        </LocaleConsumer>
    );
}

function ExtractComponent() {
    return <LocaleConsumer componentName="ComponentA">{(localeData) => <div>{localeData.customKey}</div>}</LocaleConsumer>;
}

export default function LocaleDemo() {
    const new_zh_CN = { ...zh_CN, ComponentA: { customKey: 'semi' } };
    const new_ko_KR = { ...ko_KR, ComponentA: { customKey: 'design' } };
    const new_en_GB = { ...en_GB, ComponentA: { customKey: 'dsm' } };

    return (
        <>
            <LocaleProvider locale={new_zh_CN}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={new_ko_KR}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={new_en_GB}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={new_zh_CN}>
                <ExtractComponent />
            </LocaleProvider>
            <LocaleProvider locale={new_ko_KR}>
                <ExtractComponent />
            </LocaleProvider>
            <LocaleProvider locale={new_en_GB}>
                <ExtractComponent />
            </LocaleProvider>
        </>
    );
}
