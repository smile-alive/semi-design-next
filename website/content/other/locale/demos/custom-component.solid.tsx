import { LocaleConsumer, LocaleProvider } from '@fibrae/semi-ui-solid';
import { en_US, zh_CN } from '@fibrae/semi-ui-solid/locale';

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

const new_zh_CN = { ...zh_CN, ComponentA: { customKey: 'semi' } };
const new_en_US = { ...en_US, ComponentA: { customKey: 'design' } };

export default function LocaleDemo() {
    return (
        <>
            <LocaleProvider locale={new_zh_CN}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={new_en_US}>
                <GetLocaleFromSemi />
            </LocaleProvider>
            <LocaleProvider locale={new_zh_CN}>
                <ExtractComponent />
            </LocaleProvider>
            <LocaleProvider locale={new_en_US}>
                <ExtractComponent />
            </LocaleProvider>
        </>
    );
}
