import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import ko_KR from '@fibrae/semi-foundation/locale/source/ko_KR';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { LocaleProvider, LocaleConsumer } from '@fibrae/semi-ui-solid';

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
    const zhWithCustom = { ...zh_CN, ComponentA: { customKey: 'semi' } };
    const koWithCustom = { ...ko_KR, ComponentA: { customKey: 'design' } };
    const enWithCustom = { ...en_GB, ComponentA: { customKey: 'dsm' } };

    return (
        <>
            <LocaleProvider locale={zhWithCustom}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={koWithCustom}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={enWithCustom}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={zhWithCustom}>
                <ExtractComponent />
            </LocaleProvider>
            <LocaleProvider locale={koWithCustom}>
                <ExtractComponent />
            </LocaleProvider>
            <LocaleProvider locale={enWithCustom}>
                <ExtractComponent />
            </LocaleProvider>
        </>
    );
}
