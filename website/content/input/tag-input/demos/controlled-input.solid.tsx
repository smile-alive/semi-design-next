import { createSignal } from 'solid-js';
import { TagInput } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    const [value, setValue] = createSignal('abc');
    return <TagInput inputValue={value()} onInputChange={(v) => setValue(v)} />;
}
