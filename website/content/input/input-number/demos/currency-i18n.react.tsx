import { useMemo, useState } from 'react';
import ar from '@fibrae/semi-foundation/locale/source/ar';
import de from '@fibrae/semi-foundation/locale/source/de';
import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import es from '@fibrae/semi-foundation/locale/source/es';
import fr from '@fibrae/semi-foundation/locale/source/fr';
import id_ID from '@fibrae/semi-foundation/locale/source/id_ID';
import it from '@fibrae/semi-foundation/locale/source/it';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import ko_KR from '@fibrae/semi-foundation/locale/source/ko_KR';
import ms_MY from '@fibrae/semi-foundation/locale/source/ms_MY';
import nl_NL from '@fibrae/semi-foundation/locale/source/nl_NL';
import pl_PL from '@fibrae/semi-foundation/locale/source/pl_PL';
import pt_BR from '@fibrae/semi-foundation/locale/source/pt_BR';
import ro from '@fibrae/semi-foundation/locale/source/ro';
import ru_RU from '@fibrae/semi-foundation/locale/source/ru_RU';
import sv_SE from '@fibrae/semi-foundation/locale/source/sv_SE';
import th_TH from '@fibrae/semi-foundation/locale/source/th_TH';
import tr_TR from '@fibrae/semi-foundation/locale/source/tr_TR';
import vi_VN from '@fibrae/semi-foundation/locale/source/vi_VN';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import zh_TW from '@fibrae/semi-foundation/locale/source/zh_TW';
import { LocaleProvider, InputNumber, Select } from '@fibrae/semi-ui-react';

export default function InputNumberDemo() {
    const [locale, setLocale] = useState(zh_CN);
    const [localeCode, setLocaleCode] = useState('zh_CN');

    const language = useMemo(
        () => ({
            zh_CN: zh_CN,
            en_GB: en_GB,
            en_US: en_US,
            ko_KR: ko_KR,
            ja_JP: ja_JP,
            ar: ar,
            vi_VN: vi_VN,
            ru_RU: ru_RU,
            id_ID: id_ID,
            ms_MY: ms_MY,
            th_TH: th_TH,
            tr_TR: tr_TR,
            pt_BR: pt_BR,
            zh_TW: zh_TW,
            es: es,
            sv_SE: sv_SE,
            pl_PL: pl_PL,
            nl_NL: nl_NL,
            de,
            it,
            fr,
            ro,
        }),
        []
    );

    const onLanguageChange = (code?: string) => {
        if (!code) {
            return;
        }
        setLocale(language[code as keyof typeof language]);
        setLocaleCode(code);
    };

    return (
        <>
            <div style={{ paddingBottom: 20 }}>
                <Select aria-label="切换语言" onChange={onLanguageChange} insetLabel="切换语言" style={{ width: 250 }} defaultValue="zh_CN">
                    <Select.Option value="zh_CN">简体中文</Select.Option>
                    <Select.Option value="en_US">英语（美）</Select.Option>
                    <Select.Option value="en_GB">英语（英）</Select.Option>
                    <Select.Option value="ja_JP">日语</Select.Option>
                    <Select.Option value="ko_KR">韩语</Select.Option>
                    <Select.Option value="ar">阿拉伯语</Select.Option>
                    <Select.Option value="vi_VN">越南语</Select.Option>
                    <Select.Option value="ru_RU">俄罗斯语</Select.Option>
                    <Select.Option value="id_ID">印尼语</Select.Option>
                    <Select.Option value="ms_MY">马来语</Select.Option>
                    <Select.Option value="th_TH">泰语</Select.Option>
                    <Select.Option value="tr_TR">土耳其语</Select.Option>
                    <Select.Option value="pt_BR">葡萄牙语（巴西）</Select.Option>
                    <Select.Option value="zh_TW">繁体中文</Select.Option>
                    <Select.Option value="es">西班牙语</Select.Option>
                    <Select.Option value="de">德语</Select.Option>
                    <Select.Option value="it">意大利语</Select.Option>
                    <Select.Option value="fr">法语</Select.Option>
                    <Select.Option value="ro">罗马尼亚语</Select.Option>
                    <Select.Option value="sv_SE">瑞典语</Select.Option>
                    <Select.Option value="pl_PL">波兰语</Select.Option>
                    <Select.Option value="nl_NL">荷兰语</Select.Option>
                </Select>
            </div>
            <LocaleProvider locale={locale}>
                <InputNumber aria-label="金额" key={localeCode} currency defaultValue={123456.78} />
            </LocaleProvider>
        </>
    );
}
