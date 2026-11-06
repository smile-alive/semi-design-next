import { IconArrowDown, IconArrowUp, IconDelete } from '@fibrae/semi-icons-react';
import { ArrayField, Button, Form, FormInput, IconButton } from '@fibrae/semi-ui-react';

const initValue = [{ name: '需求评审' }, { name: '开发' }, { name: '上线' }];

export default function FormDemo() {
    return (
        <Form style={{ width: 480 }}>
            {(form) => (
                <>
                    <ArrayField field="steps" initValue={initValue}>
                        {(arrayField) => (
                            <>
                                {arrayField.arrayFields.map((item, index) => (
                                    <div key={item.key} style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                                        <FormInput field={`${item.field}.name`} label={`第 ${index + 1} 步`} style={{ width: 280 }} />
                                        <IconButton aria-label={`上移第 ${index + 1} 步`} disabled={index === 0} icon={<IconArrowUp />} theme="borderless" onClick={() => arrayField.move(index, index - 1)} />
                                        <IconButton aria-label={`下移第 ${index + 1} 步`} disabled={index === arrayField.arrayFields.length - 1} icon={<IconArrowDown />} theme="borderless" onClick={() => arrayField.move(index, index + 1)} />
                                        <IconButton aria-label={`删除第 ${index + 1} 步`} icon={<IconDelete />} theme="borderless" type="danger" onClick={item.remove} />
                                    </div>
                                ))}
                                <Button theme="light" onClick={arrayField.add}>
                                    添加一步
                                </Button>
                            </>
                        )}
                    </ArrayField>
                    <pre>
                        <code>{JSON.stringify(form.formState.values)}</code>
                    </pre>
                </>
            )}
        </Form>
    );
}
