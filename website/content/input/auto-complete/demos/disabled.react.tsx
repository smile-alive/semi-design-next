import { AutoComplete } from '@fibrae/semi-ui-react';

export default function AutoCompleteDemo() {
    return <AutoComplete data={[1, 2, 3, 4]} placeholder="禁用下拉菜单" disabled style={{ width: 200 }} />;
}
