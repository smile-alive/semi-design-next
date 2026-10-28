import { useState } from 'react';
import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    const [value, setValue] = useState(['抖音']);
    const handleChange = (v: string[]) => setValue(v);
    return <TagInput value={value} onChange={handleChange} />;
}
