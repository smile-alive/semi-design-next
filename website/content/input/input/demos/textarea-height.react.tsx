import { TextArea } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    return (
        <div>
            <TextArea textareaStyle={{ height: 120 }} placeholder="高度 120px" />
            <br />
            <br />
            <TextArea textareaStyle={{ height: 200, backgroundColor: '#f9f9f9' }} placeholder="高度 200px，灰色背景" />
            <br />
            <br />
            <TextArea style={{ border: '2px solid var(--semi-color-primary)' }} textareaStyle={{ height: 150 }} placeholder="style 控制外层容器，textareaStyle 控制 textarea" />
        </div>
    );
}
