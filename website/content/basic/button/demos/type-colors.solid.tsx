import { For } from 'solid-js';

const types = [
    ['primary', '主要'],
    ['secondary', '次要'],
    ['tertiary', '第三'],
    ['warning', '警告'],
    ['danger', '危险'],
] as const;

export default function ButtonDemo() {
    return (
        <article>
            <For each={types}>{([type, label]) => <strong style={{ color: `var(--semi-color-${type})`, 'margin-right': '10px' }}>{label}</strong>}</For>
        </article>
    );
}
