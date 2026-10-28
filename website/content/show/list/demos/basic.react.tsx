import { List } from '@fibrae/semi-ui-react';

export default function ListDemo() {
    const data = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];

    return (
        <div>
            <div style={{ marginRight: 16 }}>
                <h3 style={{ marginBottom: 16 }}>Default Size</h3>
                <List header={<div>Header</div>} footer={<div>Footer</div>} bordered dataSource={data} renderItem={(item) => <List.Item>{item}</List.Item>} />
            </div>
            <div style={{ marginRight: 16 }}>
                <h3 style={{ margin: '16px 0' }}>Small Size</h3>
                <List size="small" header={<div>Header</div>} footer={<div>Footer</div>} bordered dataSource={data} renderItem={(item) => <List.Item>{item}</List.Item>} />
            </div>
            <div style={{ marginRight: 16 }}>
                <h3 style={{ margin: '16px 0' }}>Large Size</h3>
                <List size="large" header={<div>Header</div>} footer={<div>Footer</div>} bordered dataSource={data} renderItem={(item) => <List.Item>{item}</List.Item>} />
            </div>
        </div>
    );
}
