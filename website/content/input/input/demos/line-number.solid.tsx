import { TextArea } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    return <TextArea aria-label="带行号的文本" showLineNumber lineNumberStart={1} defaultValue={'Line 1\nLine 2\n这是一行较长的文本，用来演示软换行时的行号对齐效果。\nLine 4\nLine 5'} rows={12} style={{ width: '420px' }} lineNumberStyle={{ color: 'var(--semi-color-text-2)' }} />;
}
