import { AutoComplete } from '@fibrae/semi-ui-react';

export default function AutoCompleteDemo() {
    return (
        <div>
            <AutoComplete data={[1, 2, 3, 4]} size="small" placeholder="small" style={{ width: 200 }} />
            <br />
            <br />
            <AutoComplete data={[1, 2, 3, 4]} size="default" placeholder="default" style={{ width: 200 }} />
            <br />
            <br />
            <AutoComplete data={[1, 2, 3, 4]} size="large" placeholder="large" style={{ width: 200 }} />
        </div>
    );
}
