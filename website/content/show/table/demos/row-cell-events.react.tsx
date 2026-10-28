import { useMemo, useState } from 'react';
import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps, type OnHeaderRow, type OnRow } from '@fibrae/semi-ui-react';

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

export default function TableDemo() {
    const columns = useMemo<ColumnProps<Row>[]>(
        () => [
            {
                title: '标题',
                dataIndex: 'name',
                width: 400,
                render: (text) => {
                    return (
                        <div>
                            <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ marginRight: 12 }} />
                            {text}
                        </div>
                    );
                },
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
                            <Avatar size="small" color={record.avatarBg} style={{ marginRight: 4 }}>
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
        ],
        []
    );

    const [data] = useState(() => {
        const _data: Row[] = [];
        for (let i = 0; i < 46; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            _data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return _data;
    });

    const onRow = useMemo<OnRow<Row>>(
        () => (record, index) => {
            const props = {
                className: 'my-tr-class',
            };

            if (index === 2) {
                return {
                    ...props,
                    onClick: () => console.log('mouse click: ', record, index),
                };
            } else {
                return {
                    ...props,
                };
            }
        },
        []
    );
    const onHeaderRow = useMemo<OnHeaderRow<Row>>(
        () => (columns, index) => {
            return {
                onMouseEnter: () => console.log('mouse enter: ', columns, index),
                onMouseLeave: () => console.log('mouse leave: ', columns, index),
            };
        },
        []
    );

    return <Table columns={columns} dataSource={data} onRow={onRow} onHeaderRow={onHeaderRow} />;
}
