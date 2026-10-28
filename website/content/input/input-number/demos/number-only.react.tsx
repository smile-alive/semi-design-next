import { InputNumber } from '@fibrae/semi-ui-react';

export default function InputNumberDemo() {
    return <InputNumber aria-label="Integer" formatter={(value) => `${value}`.replace(/\D/g, '')} onNumberChange={(number) => console.log(number)} min={0} max={Number.MAX_SAFE_INTEGER} />;
}
