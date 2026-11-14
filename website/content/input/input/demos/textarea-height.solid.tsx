import { TextArea } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    return (
        <div>
            <TextArea styles={{ textarea: { height: '120px' } }} placeholder="高度 120px" />
            <br />
            <br />
            <TextArea styles={{ textarea: { height: '200px', 'background-color': '#f9f9f9' } }} placeholder="高度 200px，灰色背景" />
            <br />
            <br />
            <TextArea style={{ border: '2px solid var(--semi-color-primary)' }} styles={{ textarea: { height: '150px' } }} placeholder="style 控制外层容器，styles.textarea 控制 textarea" />
        </div>
    );
}
