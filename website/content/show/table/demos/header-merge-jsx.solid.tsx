import * as dateFns from 'date-fns';
import { IconMore } from '@fibrae/semi-icons-solid';
import { Table, Avatar } from '@fibrae/semi-ui-solid';

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

const renderName = (text: string) => {
    return (
        <span>
            <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ 'margin-right': '12px' }} />
            {text}
        </span>
    );
};

const renderOwner = (text: string, record: Row) => {
    return (
        <div>
            <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
                {typeof text === 'string' && text.slice(0, 1)}
            </Avatar>
            {text}
        </div>
    );
};

export default function TableDemo() {
    return (
        <Table rowSelection={{ fixed: true }} expandedRowRender={(record) => <article>{record.name}</article>} dataSource={dataSource} scroll={{ x: 1000, y: 400 }} onChange={(changeInfo) => console.log(changeInfo)}>
            <Table.Column title="基本信息" fixed="left">
                <Table.Column title="标题" dataIndex="name" width={300} fixed render={renderName} filters={nameFilters} onFilter={(value, record) => (record as Row).name.includes(value)} />
                <Table.Column title="大小" dataIndex="size" width={100} fixed render={(text) => `${text} KB`} sorter={(a, b) => ((a as Row).size - (b as Row).size > 0 ? 1 : -1)} />
            </Table.Column>
            <Table.Column title="其他信息">
                <Table.Column title="所有者" dataIndex="owner" render={renderOwner} />
                <Table.Column title="更新日期" dataIndex="updateTime" sorter={(a, b) => ((a as Row).updateTime - (b as Row).updateTime > 0 ? 1 : -1)} render={(value) => dateFns.format(new Date(value), 'yyyy-MM-dd')} />
            </Table.Column>
            <Table.Column title="更多" dataIndex="operate" fixed="right" width={100} align="center" render={() => <IconMore />} />
        </Table>
    );
}
