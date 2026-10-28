import { TagInput, Toast } from '@fibrae/semi-ui-solid';

export default function TagInputDemo() {
    return (
        <>
            <TagInput
                max={3}
                placeholder="最多输入3条标签.."
                onChange={(v) => console.log(v)}
                onExceed={(v) => {
                    Toast.warning('超过 max');
                    console.log(v);
                }}
            />
            <TagInput
                maxLength={5}
                placeholder="单个标签长度不超过5..."
                style={{ 'margin-top': '12px' }}
                onChange={(v) => console.log(v)}
                onInputExceed={(v) => {
                    Toast.warning('超过 maxLength');
                    console.log(v);
                }}
            />
        </>
    );
}
