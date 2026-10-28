import { TextArea } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    return (
        <div>
            <TextArea aria-label="单行自适应高度" autosize rows={1} />
            <br />
            <br />
            <TextArea aria-label="限制行数的自适应高度" autosize={{ minRows: 1, maxRows: 3 }} />
            <br />
            <br />
            <TextArea aria-label="限制字数的自适应高度" autosize maxCount={100} />
        </div>
    );
}
