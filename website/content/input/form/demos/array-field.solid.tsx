import { For } from 'solid-js';
import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-solid';
import { ArrayField, Button, Form, FormInput, FormSelect, TextArea, useFormState } from '@fibrae/semi-ui-solid';

const data = [
    { name: 'Semi D2C', role: 'Engineer' },
    { name: 'Semi C2D', role: 'Designer' },
];

const roleOptions = [
    { label: 'Engineer', value: 'Engineer' },
    { label: 'Designer', value: 'Designer' },
];

function ComponentUsingFormState() {
    const formState = useFormState();
    return <TextArea aria-label="Form state" style={{ 'margin-top': '10px' }} value={JSON.stringify(formState())} />;
}

export default function FormDemo() {
    return (
        <Form style={{ width: '800px' }} labelPosition="left" labelWidth="100px" allowEmpty>
            <ArrayField field="rules" initValue={data}>
                {(props) => (
                    <>
                        <Button onClick={props.add} icon={<IconPlusCircle />} theme="light">
                            Add new line
                        </Button>
                        <Button icon={<IconPlusCircle />} onClick={() => props.addWithInitValue({ name: 'Semi DSM', role: 'Designer' })} style={{ 'margin-left': '8px' }}>
                            Add new line with init value
                        </Button>
                        <For each={props.arrayFields}>
                            {(row) => (
                                <div style={{ width: '1000px', display: 'flex' }}>
                                    <FormInput field={`${row.field}[name]`} label={`${row.field}.name`} style={{ width: '200px', 'margin-right': '16px' }} />
                                    <FormSelect field={`${row.field}[role]`} label={`${row.field}.role`} style={{ width: '120px' }} optionList={roleOptions} />
                                    <Button type="danger" theme="borderless" aria-label="Delete" icon={<IconMinusCircle />} onClick={row.remove} style={{ margin: '12px' }} />
                                </div>
                            )}
                        </For>
                    </>
                )}
            </ArrayField>
            <ComponentUsingFormState />
        </Form>
    );
}
