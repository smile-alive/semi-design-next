import { useState } from 'react';
import { TagInput } from '@fibrae/semi-ui-react';

export default function TagInputDemo() {
    const [value, setValue] = useState('abc');
    const handleInputChange = (v: string) => setValue(v);
    return <TagInput inputValue={value} onInputChange={handleInputChange} />;
}
