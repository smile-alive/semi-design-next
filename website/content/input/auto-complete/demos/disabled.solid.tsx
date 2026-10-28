import { AutoComplete } from '@fibrae/semi-ui-solid';

const data = [1, 2, 3, 4];

export default function AutoCompleteDemo() {
    return <AutoComplete data={data} placeholder="禁用下拉菜单" disabled style={{ width: '200px' }} />;
}
