import { InputNumber } from '@fibrae/semi-ui-react';

export default function InputNumberDemo() {
    const defaultValue = 123456.78;
    return (
        <div>
            <div id="inputnumber-currency-locale-cny">🇨🇳 人民币</div>
            <InputNumber aria-labelledby="inputnumber-currency-locale-cny" localeCode="zh-CN" currency="CNY" defaultValue={defaultValue} />
            <br />
            <br />
            <div id="inputnumber-currency-locale-eur">🇪🇺 欧元</div>
            <InputNumber aria-labelledby="inputnumber-currency-locale-eur" localeCode="de-DE" currency="EUR" defaultValue={defaultValue} />
            <br />
            <br />
            <div id="inputnumber-currency-locale-jpy">🇯🇵 日元</div>
            <InputNumber aria-labelledby="inputnumber-currency-locale-jpy" localeCode="ja-JP" currency="JPY" defaultValue={defaultValue} />
            <br />
            <br />
            <div id="inputnumber-currency-locale-vnd">🇻🇳 越南盾</div>
            <InputNumber aria-labelledby="inputnumber-currency-locale-vnd" localeCode="vi-VN" currency="VND" defaultValue={defaultValue} />
            <br />
            <br />
        </div>
    );
}
