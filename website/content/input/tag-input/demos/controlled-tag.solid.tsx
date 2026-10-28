import { createSignal } from 'solid-js';
import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    const [value, setValue] = createSignal(['抖音']);
    return <TagInput value={value()} onChange={(v) => setValue(v)} />;
}
