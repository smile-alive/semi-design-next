import { useState } from 'react';
import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps, type RenderReturnObject } from '@fibrae/semi-ui-react';

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
        render: (text, _record, index) => {
            const children = (
                <div>
                    <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ marginRight: 12 }} />
                    {text}
                </div>
            );
            const renderObject: RenderReturnObject = { children, props: {} };
            if (index === 0) {
                renderObject.props = {
                    colSpan: 4,
                };
            }
            if (index === 1) {
                renderObject.props = {
                    rowSpan: 2,
                };
            }
            if (index === 2) {
                renderObject.props = {
                    rowSpan: 0,
                };
            }
            return renderObject;
        },
    },
    {
        title: '大小',
        dataIndex: 'size',
        render: (text, _record, index) => {
            if (index === 0) {
                return {
                    children: `${text} KB`,
                    props: {
                        colSpan: 0,
                    },
                };
            }
            if (index === 1) {
                return {
                    children: `${text} KB`,
                    props: {
                        rowSpan: 2,
                    },
                };
            }
            if (index === 2) {
                return {
                    children: `${text} KB`,
                    props: {
                        rowSpan: 0,
                    },
                };
            }
            return `${text} KB`;
        },
    },
    {
        title: '所有者',
        dataIndex: 'owner',
        render: (text, record, index) => {
            const children = (
                <div>
                    <Avatar size="small" color={record.avatarBg} style={{ marginRight: 4 }}>
                        {typeof text === 'string' && text.slice(0, 1)}
                    </Avatar>
                    {text}
                </div>
            );
            if (index === 0) {
                return {
                    children,
                    props: {
                        colSpan: 0,
                    },
                };
            }
            return children;
        },
    },
    {
        title: '更新日期',
        dataIndex: 'updateTime',
        sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        render: (value, _record, index) => {
            const children = dateFns.format(new Date(value), 'yyyy-MM-dd');
            if (index === 0) {
                return {
                    children,
                    props: {
                        colSpan: 0,
                    },
                };
            }
            if (index === 1) {
                return {
                    children,
                    props: {
                        rowSpan: 2,
                    },
                };
            }
            if (index === 2) {
                return {
                    children,
                    props: {
                        rowSpan: 0,
                    },
                };
            }
            return children;
        },
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
            updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

export default function TableDemo() {
    const [dataSource] = useState(() => getData(5));

    return <Table columns={columns} dataSource={dataSource} pagination={false} />;
}
