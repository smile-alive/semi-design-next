import { useState } from 'react';
import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    const [value, setValue] = useState(['短视频']);
    const handleChange = (v: string[]) => setValue(v);
    return <TagInput value={value} onChange={handleChange} />;
}
