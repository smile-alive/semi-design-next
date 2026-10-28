import { Transfer } from '@fibrae/semi-ui-react';
export default function TransferDemo() {
    const data = Array.from({ length: 20 }, (_v, i) => {
        return {
            label: `选项名称 ${i}`,
            value: i,
            disabled: false,
            key: `key-${i}`,
        };
    });
    return <Transfer style={{ width: 568, height: 416 }} disabled dataSource={data} defaultValue={[2, 4]} onChange={(values, items) => console.log(values, items)} />;
}
