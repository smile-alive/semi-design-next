import { TagInput } from '@fibrae/semi-ui-solid';

const separators = ['-', '/', '|', '++'];

export default function TagInputDemo() {
    return (
        <>
            <TagInput separator="-" placeholder="使用 - 进行批量输入" onChange={(v) => console.log(v)} />
            <br />
            <br />
            <TagInput separator={separators} placeholder="支持多个分隔符进行批量输入" onChange={(v) => console.log(v)} />
        </>
    );
}
