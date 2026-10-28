import { TextArea } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    return (
        <div>
            <TextArea textareaStyle={{ height: '120px' }} placeholder="高度 120px" />
            <br />
            <br />
            <TextArea textareaStyle={{ height: '200px', 'background-color': '#f9f9f9' }} placeholder="高度 200px，灰色背景" />
            <br />
            <br />
            <TextArea style={{ border: '2px solid var(--semi-color-primary)' }} textareaStyle={{ height: '150px' }} placeholder="style 控制外层容器，textareaStyle 控制 textarea" />
        </div>
    );
}
