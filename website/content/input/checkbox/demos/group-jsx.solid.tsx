import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-solid';

export default function CheckboxDemo() {
    return (
        <CheckboxGroup style={{ width: '100%' }} defaultValue={['A', 'B']} aria-label="CheckboxGroup 示例">
            <Checkbox value="A">A</Checkbox>
            <Checkbox value="B">B</Checkbox>
            <Checkbox value="C">C</Checkbox>
            <Checkbox value="D">D</Checkbox>
            <Checkbox value="E">E</Checkbox>
        </CheckboxGroup>
    );
}
