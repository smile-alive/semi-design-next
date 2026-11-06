import { For } from 'solid-js';
import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-solid';
import { ArrayField, Button, Form, FormInput, FormSelect, TextArea } from '@fibrae/semi-ui-solid';

const data = [
    { name: 'Semi D2C', role: 'Engineer' },
    { name: 'Semi C2D', role: 'Designer' },
];

const roleOptions = [
    { label: 'Engineer', value: 'Engineer' },
    { label: 'Designer', value: 'Designer' },
];

export default function FormDemo() {
    return (
        <Form style={{ width: '800px' }} labelPosition="left" labelWidth="100px" allowEmpty>
            {(form) => (
                <>
                    <ArrayField field="rules" initValue={data}>
                        {(arrayField) => (
                            <>
                                <Button onClick={arrayField.add} icon={<IconPlusCircle />} theme="light">
                                    Add new line
                                </Button>
                                <Button icon={<IconPlusCircle />} onClick={() => arrayField.addWithInitValue({ name: 'Semi DSM', role: 'Designer' })} style={{ 'margin-inline-start': '8px' }}>
                                    Add new line with init value
                                </Button>
                                <For each={arrayField.arrayFields}>
                                    {(item) => (
                                        <div style={{ width: '1000px', display: 'flex' }}>
                                            <FormInput field={`${item.field}[name]`} label={`${item.field}.name`} style={{ width: '200px', 'margin-inline-end': '16px' }} />
                                            <FormSelect field={`${item.field}[role]`} label={`${item.field}.role`} style={{ width: '120px' }} optionList={roleOptions} />
                                            <Button type="danger" theme="borderless" aria-label="Delete" icon={<IconMinusCircle />} onClick={item.remove} style={{ margin: '12px' }} />
                                        </div>
                                    )}
                                </For>
                            </>
                        )}
                    </ArrayField>
                    <TextArea aria-label="Form state" style={{ 'margin-block-start': '10px' }} value={JSON.stringify(form.formState)} />
                </>
            )}
        </Form>
    );
}
