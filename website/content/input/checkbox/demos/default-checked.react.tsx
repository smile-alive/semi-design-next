import { Checkbox } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    return (
        <Checkbox defaultChecked onChange={(e) => console.log(e)} aria-label="Checkbox 示例">
            Semi Design
        </Checkbox>
    );
}
