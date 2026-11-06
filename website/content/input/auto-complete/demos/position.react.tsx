import { useState } from 'react';
import { AutoComplete } from '@fibrae/semi-ui-react';

const domains = ['gmail.com', '163.com', 'qq.com'];

export default function AutoCompleteDemo() {
    const [data, setData] = useState<string[]>([]);

    const change = (input: string) => {
        setData(input ? domains.map((domain) => `${input}@${domain}`) : []);
    };

    return (
        <div>
            <AutoComplete data={data} position="top" onSearch={change} placeholder="选项菜单在上方显示" style={{ width: 200, margin: 10 }} />
            <AutoComplete data={data} position="rightTop" onSearch={change} placeholder="选项菜单在右侧显示" style={{ width: 200, margin: 10 }} />
        </div>
    );
}
