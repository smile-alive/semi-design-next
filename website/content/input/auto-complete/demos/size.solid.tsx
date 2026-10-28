import { AutoComplete } from '@fibrae/semi-ui-solid';

const data = [1, 2, 3, 4];

export default function AutoCompleteDemo() {
    return (
        <div>
            <AutoComplete data={data} size="small" placeholder="small" style={{ width: '200px' }} />
            <br />
            <br />
            <AutoComplete data={data} size="default" placeholder="default" style={{ width: '200px' }} />
            <br />
            <br />
            <AutoComplete data={data} size="large" placeholder="large" style={{ width: '200px' }} />
        </div>
    );
}
