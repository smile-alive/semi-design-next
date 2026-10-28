import { Checkbox } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    return (
        <div>
            <Checkbox defaultChecked={false} disabled aria-label="Checkbox 示例">
                Unchecked Disabled
            </Checkbox>
            <br />
            <Checkbox defaultChecked disabled aria-label="Checkbox 示例">
                Checked Disabled
            </Checkbox>
        </div>
    );
}
