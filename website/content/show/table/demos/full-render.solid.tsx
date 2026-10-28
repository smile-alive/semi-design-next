import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-solid';

const DAY = 24 * 60 * 60 * 1000;
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
        // Each part is a render function: call it where the button is inserted
        title: (props) => (
            <span style={{ display: 'inline-flex', 'align-items': 'center', 'padding-left': '20px' }}>
                {props.selection?.()}
                <span style={{ 'margin-left': '8px' }}>Name</span>
                {props.sorter?.()}
                {props.filter?.()}
            </span>
        ),
        dataIndex: 'name',
        width: 400,
        filters: [
            {
                text: 'Semi Design 设计稿',
                value: 'Semi Design 设计稿',
            },
            {
                text: 'Semi D2C 设计稿',
                value: 'Semi D2C 设计稿',
            },
        ],
        onFilter: (value, record) => record.name.includes(value),
        useFullRender: true,
        // The fourth render parameter holds the expand button, selection button and text
        render: (text, _record, _index, options) => {
            return (
                <span style={{ display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center' }}>
                    {options.indentText?.()}
                    {options.expandIcon?.()}
                    {options.selection?.()}
                    <span style={{ 'margin-left': '8px' }}>
                        <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ 'margin-right': '12px' }} />
                        {text}
                    </span>
                </span>
            );
        },
    },
    {
        title: '大小',
        dataIndex: 'size',
        sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        render: (text) => `${text} KB`,
    },
    {
        title: '所有者',
        dataIndex: 'owner',
        render: (text, record) => {
            return (
                <div>
                    <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
                        {typeof text === 'string' && text.slice(0, 1)}
                    </Avatar>
                    {text}
                </div>
            );
        },
    },
    {
        title: '更新日期',
        dataIndex: 'updateTime',
        sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        render: (value) => {
            return dateFns.format(new Date(value), 'yyyy-MM-dd');
        },
    },
];

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

const dataSource = getData(46);

const pagination = {
    pageSize: 12,
};

const rowSelection: RowSelectionProps<Row> = {
    hidden: true,
    fixed: 'left',
};

export default function TableDemo() {
    return <Table pagination={pagination} rowSelection={rowSelection} columns={columns} dataSource={dataSource} onChange={(changeInfo) => console.log(changeInfo)} expandedRowRender={(record) => <article>{record.name}</article>} />;
}
