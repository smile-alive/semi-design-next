import { createSignal } from 'solid-js';
import { AutoComplete } from '@fibrae/semi-ui-solid';

const domains = ['gmail.com', '163.com', 'qq.com'];

export default function AutoCompleteDemo() {
    const [data, setData] = createSignal<string[]>([]);

    const change = (input: string) => {
        setData(input ? domains.map((domain) => `${input}@${domain}`) : []);
    };

    return (
        <div>
            <AutoComplete data={data()} position="top" onSearch={change} placeholder="选项菜单在上方显示" style={{ width: '200px', margin: '10px' }} />
            <AutoComplete data={data()} position="rightTop" onSearch={change} placeholder="选项菜单在右侧显示" style={{ width: '200px', margin: '10px' }} />
        </div>
    );
}
