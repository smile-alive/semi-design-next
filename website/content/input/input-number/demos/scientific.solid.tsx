import { InputNumber } from '@fibrae/semi-ui-solid';

export default function InputNumberDemo() {
    return (
        <div style={{ width: '280px' }}>
            <span id="inputnumber-scientific-default">启用科学计数法（默认阈值 15 位）</span>
            <InputNumber aria-labelledby="inputnumber-scientific-default" scientificNotation defaultValue={123456789012345} />
            <br />
            <br />

            <span id="inputnumber-scientific-threshold">自定义阈值（10 位）</span>
            <InputNumber aria-labelledby="inputnumber-scientific-threshold" scientificNotation={{ threshold: 10 }} defaultValue={1234567890} />
            <br />
            <br />

            <span id="inputnumber-scientific-large">超大数字</span>
            <InputNumber aria-labelledby="inputnumber-scientific-large" scientificNotation defaultValue={1e16} />
            <br />
            <br />

            <span id="inputnumber-scientific-decimal">小数场景</span>
            <InputNumber aria-labelledby="inputnumber-scientific-decimal" scientificNotation precision={10} defaultValue={0.000000123456789} />
            <br />
            <br />
        </div>
    );
}
