import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    return (
        <TagInput
            defaultValue={['抖音']}
            placeholder="请输入..."
            showClear
            onFocus={() => {
                console.log(`onFocus`);
            }}
            onBlur={() => {
                console.log(`onBlur`);
            }}
            onChange={(tag) => {
                console.log(`onChange,当前标签数组：${tag}`);
            }}
            onAdd={(tag) => {
                console.log(`onAdd，新增：${tag}`);
            }}
            onRemove={(v, i) => {
                console.log(`onRemove，移除：${v}, 序号：${i}`);
            }}
            onInputChange={(input) => {
                console.log(`onInputChange，当前输入内容：${input}`);
            }}
        />
    );
}
