import { Input } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    return (
        <>
            <Input aria-label="可用的输入框" defaultValue="enabled input" />
            <br />
            <br />
            <Input aria-label="禁用的输入框" disabled defaultValue="disabled input" />
        </>
    );
}
