import { useMemo, type ReactNode } from 'react';
import * as dateFns from 'date-fns';
import { IconMore } from '@fibrae/semi-icons-react';
import { Table, Avatar } from '@fibrae/semi-ui-react';

const DAY = 24 * 60 * 60 * 1000;
const figmaIconUrl = '/assets/placeholder/app.svg';
const Column = Table.Column;

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

function getData(total: number) {
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
}

export default function TableDemo() {
    const data = useMemo(() => {
        const _data = getData(46);
        return _data;
    }, []);

    const nameFilters = [
        {
            text: 'Semi Design 设计稿',
            value: 'Semi Design 设计稿',
        },
        {
            text: 'Semi D2C 设计稿',
            value: 'Semi D2C 设计稿',
        },
    ];

    const renderName = (text: ReactNode) => {
        return (
            <span>
                <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ marginRight: 12 }} />
                {text}
            </span>
        );
    };

    const renderOwner = (text: ReactNode, record: Row) => {
        return (
            <div>
                <Avatar size="small" color={record.avatarBg} style={{ marginRight: 4 }}>
                    {typeof text === 'string' && text.slice(0, 1)}
                </Avatar>
                {text}
            </div>
        );
    };

    return (
        <Table rowSelection={{ fixed: true }} expandedRowRender={(record) => <article>{record.name}</article>} dataSource={data} scroll={{ x: 1000, y: 400 }} onChange={(...args) => console.log(...args)}>
            <Column title="基本信息" fixed="left">
                <Column<Row> title="标题" dataIndex="name" width={300} fixed render={renderName} filters={nameFilters} onFilter={(value, record) => record.name.includes(value)} />
                <Column<Row> title="大小" dataIndex="size" width={100} fixed render={(text) => `${text} KB`} sorter={(a, b) => (a.size - b.size > 0 ? 1 : -1)} />
            </Column>
            <Column title="其他信息">
                <Column title="所有者" dataIndex="owner" render={renderOwner} />
                <Column<Row> title="更新日期" dataIndex="updateTime" sorter={(a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1)} render={(value) => dateFns.format(new Date(value), 'yyyy-MM-dd')} />
            </Column>
            <Column title="更多" dataIndex="operate" fixed="right" width={100} align="center" render={() => <IconMore />} />
        </Table>
    );
}
