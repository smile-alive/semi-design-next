import { AutoComplete } from '@fibrae/semi-ui-solid';

export default function AutoCompleteDemo() {
    return (
        <>
            <AutoComplete aria-label="Warning status" defaultValue="ies" validateStatus="warning" />
            <br />
            <br />
            <AutoComplete aria-label="Error status" defaultValue="ies" validateStatus="error" />
            <br />
            <br />
            <AutoComplete aria-label="Default status" defaultValue="ies" />
        </>
    );
}
