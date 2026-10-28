import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps } from '@fibrae/semi-ui-solid';

const figmaIconUrl = '/assets/placeholder/app.svg';

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

const columns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
        width: 400,
        onCell: (_record, index) => {
            if (index === 0) {
                return { colSpan: 4 };
            }
            if (index === 1) {
                return { rowSpan: 2 };
            }
            if (index === 2) {
                return { rowSpan: 0 };
            }
            return {};
        },
        render: (text) => (
            <div>
                <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ 'margin-right': '12px' }} />
                {text}
            </div>
        ),
    },
    {
        title: '大小',
        dataIndex: 'size',
        onCell: (_record, index) => {
            if (index === 0) {
                return { colSpan: 0 };
            }
            if (index === 1) {
                return { rowSpan: 2 };
            }
            if (index === 2) {
                return { rowSpan: 0 };
            }
            return {};
        },
        render: (text) => `${text} KB`,
    },
    {
        title: '所有者',
        dataIndex: 'owner',
        onCell: (_record, index) => (index === 0 ? { colSpan: 0 } : {}),
        render: (text, record) => (
            <div>
                <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
                    {typeof text === 'string' && text.slice(0, 1)}
                </Avatar>
                {text}
            </div>
        ),
    },
    {
        title: '更新日期',
        dataIndex: 'updateTime',
        sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        onCell: (_record, index) => {
            if (index === 0) {
                return { colSpan: 0 };
            }
            if (index === 1) {
                return { rowSpan: 2 };
            }
            if (index === 2) {
                return { rowSpan: 0 };
            }
            return {};
        },
        render: (value) => dateFns.format(new Date(value), 'yyyy-MM-dd'),
    },
];

const DAY = 24 * 60 * 60 * 1000;

const getData = (total: number) => {
    const data: Row[] = [];
    for (let i = 0; i < total; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

const dataSource = getData(5);

export default function TableDemo() {
    return <Table columns={columns} dataSource={dataSource} pagination={false} />;
}
