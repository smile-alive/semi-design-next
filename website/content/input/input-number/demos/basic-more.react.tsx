import { InputNumber } from '@fibrae/semi-ui-react';

export default function InputNumberDemo() {
    return (
        <div style={{ width: 280 }}>
            <span id="inputnumber-basic-more-default-value">设置了默认值 defaultValue=1 </span>
            <InputNumber aria-labelledby="inputnumber-basic-more-default-value" defaultValue={1} />
            <br />
            <br />

            <span id="inputnumber-basic-more-disabled">禁用 disabled=true</span>
            <InputNumber aria-labelledby="inputnumber-basic-more-disabled" defaultValue={2} disabled />
            <br />
            <br />

            <span id="inputnumber-basic-more-precision">设置了小数位数 precision=2 </span>
            <InputNumber aria-labelledby="inputnumber-basic-more-precision" precision={2} defaultValue={1.234} />
            <br />
            <br />

            <span id="inputnumber-basic-more-inner-buttons">设置了 innerButtons=true </span>
            <InputNumber aria-labelledby="inputnumber-basic-more-inner-buttons" innerButtons suffix="小时" defaultValue={1} style={{ width: 190 }} />
            <br />
        </div>
    );
}
