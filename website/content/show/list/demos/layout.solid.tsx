import { Avatar, List, type AvatarColor } from '@fibrae/semi-ui-solid';

interface Item {
    title: string;
    color: AvatarColor;
}

const data: Item[] = [
    {
        title: 'Semi Design Title 1',
        color: 'light-blue',
    },
    {
        title: 'Semi Design Title 2',
        color: 'grey',
    },
    {
        title: 'Semi Design Title 3',
        color: 'light-green',
    },
];

export default function ListDemo() {
    return (
        <div style={{ padding: '12px', border: '1px solid var(--semi-color-border)', margin: '12px' }}>
            <List
                dataSource={data}
                layout="horizontal"
                renderItem={(item) => (
                    <List.Item
                        header={<Avatar color={item.color}>SE</Avatar>}
                        main={
                            <div>
                                <span style={{ color: 'var(--semi-color-text-0)', 'font-weight': '500' }}>{item.title}</span>
                                <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                            </div>
                        }
                    />
                )}
            />
        </div>
    );
}
