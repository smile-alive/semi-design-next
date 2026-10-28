import { Input } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    return (
        <>
            <Input aria-label="警告状态" defaultValue="ies" validateStatus="warning" />
            <br />
            <br />
            <Input aria-label="错误状态" defaultValue="ies" validateStatus="error" />
            <br />
            <br />
            <Input aria-label="默认状态" defaultValue="ies" />
        </>
    );
}
