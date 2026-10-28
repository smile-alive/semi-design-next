import { IconArrowUp } from '@fibrae/semi-icons-solid';
import { Descriptions, type DescriptionsData } from '@fibrae/semi-ui-solid';

const data: DescriptionsData[] = [
    { key: '实际用户数量', value: '1,480,000' },
    { key: '7天留存', value: '98%' },
    { key: '安全等级', value: '3级' },
];

const renderValue = (item: DescriptionsData, index: number) =>
    index === 1 ? (
        <span>
            {item.value}
            <IconArrowUp size="small" style={{ color: 'red', 'margin-left': '4px' }} />
        </span>
    ) : (
        item.value
    );

const style = {
    'box-shadow': 'var(--semi-shadow-elevated)',
    'background-color': 'var(--semi-color-bg-2)',
    'border-radius': '4px',
    padding: '10px',
    'margin-right': '20px',
    width: '600px',
};

export default function DescriptionsDemo() {
    return (
        <div>
            <Descriptions data={data} renderValue={renderValue} row size="small" style={style} />
            <br />
            <Descriptions data={data} renderValue={renderValue} row style={style} />
            <br />
            <Descriptions data={data} renderValue={renderValue} row size="large" style={style} />
        </div>
    );
}
