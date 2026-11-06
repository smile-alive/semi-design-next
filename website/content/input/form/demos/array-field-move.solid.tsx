import { For } from 'solid-js';
import { IconArrowDown, IconArrowUp, IconDelete } from '@fibrae/semi-icons-solid';
import { ArrayField, Button, Form, FormInput, IconButton, useFormState } from '@fibrae/semi-ui-solid';

const initValue = [{ name: '需求评审' }, { name: '开发' }, { name: '上线' }];

function ComponentUsingFormState() {
    const formState = useFormState();
    return (
        <pre>
            <code>{JSON.stringify(formState().values)}</code>
        </pre>
    );
}

export default function FormDemo() {
    return (
        <Form style={{ width: '480px' }}>
            <ArrayField field="steps" initValue={initValue}>
                {(props) => (
                    <>
                        <For each={props.arrayFields}>
                            {(row, index) => (
                                <div style={{ display: 'flex', 'align-items': 'flex-end', gap: '4px' }}>
                                    <FormInput field={`${row.field}.name`} label={`第 ${index() + 1} 步`} style={{ width: '280px' }} />
                                    <IconButton aria-label={`上移第 ${index() + 1} 步`} disabled={index() === 0} icon={<IconArrowUp />} theme="borderless" onClick={() => props.move(index(), index() - 1)} />
                                    <IconButton aria-label={`下移第 ${index() + 1} 步`} disabled={index() === props.arrayFields.length - 1} icon={<IconArrowDown />} theme="borderless" onClick={() => props.move(index(), index() + 1)} />
                                    <IconButton aria-label={`删除第 ${index() + 1} 步`} icon={<IconDelete />} theme="borderless" type="danger" onClick={row.remove} />
                                </div>
                            )}
                        </For>
                        <Button theme="light" onClick={props.add}>
                            添加一步
                        </Button>
                    </>
                )}
            </ArrayField>
            <ComponentUsingFormState />
        </Form>
    );
}
