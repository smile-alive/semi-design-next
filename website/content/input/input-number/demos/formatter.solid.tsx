import { InputNumber } from '@fibrae/semi-ui-solid';

const log = (v: number | string) => {
    console.log(`Changed to: [${typeof v}] ${v}`);
};

export default function InputNumberDemo() {
    return (
        <div style={{ width: '180px' }}>
            <span id="inputnumber-formatter-rmb">人民币</span>
            <InputNumber aria-labelledby="inputnumber-formatter-rmb" onChange={log} defaultValue={1000} min={0} formatter={(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/￥\s?|(,*)/g, '')} />
            <br />
            <br />

            <span id="inputnumber-formatter-custom">自定义串</span>
            <InputNumber aria-labelledby="inputnumber-formatter-custom" onChange={log} defaultValue={1111} formatter={(value) => String(value).split('').join('-')} parser={(value) => value.replace(/-/g, '')} />
            <br />
        </div>
    );
}
