import { Transfer } from '@fibrae/semi-ui-solid';

const data = Array.from({ length: 100 }, (_, i) => {
    return {
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    };
});

export default function TransferDemo() {
    return (
        <Transfer
            style={{ width: '568px', height: '416px' }}
            dataSource={data}
            pagination={{
                pageSize: 10,
            }}
            onChange={(values, items) => console.log(values, items)}
        />
    );
}
