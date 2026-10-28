import { InputNumber } from '@fibrae/semi-ui-solid';

const defaultValue = 123456.78;

export default function InputNumberDemo() {
    return (
        <div>
            <div id="inputnumber-currency-affix-code">🇨🇳 CNY ➕ code</div>
            <InputNumber aria-labelledby="inputnumber-currency-affix-code" style={{ width: '200px' }} currency="CNY" prefix="CNY" showCurrencySymbol={false} defaultValue={defaultValue} />
            <br />
            <br />
            <div id="inputnumber-currency-affix-symbol">🇨🇳 CNY ➕ symbol</div>
            <InputNumber aria-labelledby="inputnumber-currency-affix-symbol" style={{ width: '200px' }} currency="CNY" prefix="￥" showCurrencySymbol={false} defaultValue={defaultValue} />
            <br />
            <br />
            <div id="inputnumber-currency-affix-name">🇨🇳 CNY ➕ name</div>
            <InputNumber aria-labelledby="inputnumber-currency-affix-name" style={{ width: '200px' }} currency="CNY" suffix="人民币" showCurrencySymbol={false} defaultValue={defaultValue} />
            <br />
            <br />
        </div>
    );
}
