import { TextArea } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    return (
        <div>
            <TextArea aria-label="Text area" />
            <br />
            <br />
            <TextArea aria-label="Text area with character limit" maxCount={100} showClear />
        </div>
    );
}
