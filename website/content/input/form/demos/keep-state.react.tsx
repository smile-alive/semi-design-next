import { useState } from 'react';
import { Form, FormInput, FormSwitch, Switch, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const [show, setShow] = useState(true);

    return (
        <Form style={{ width: 450 }}>
            <FormSwitch field="alwaysShow" label="始终显示的字段" />
            <Switch aria-labelledby="form-keep-state-toggle" checked={show} onChange={setShow} style={{ marginBlockEnd: 12 }} />
            <span id="form-keep-state-toggle" style={{ marginInlineStart: 8, color: 'var(--semi-color-text-2)' }}>
                显示条件字段
            </span>
            {show && (
                <>
                    <FormInput field="kept" label="条件字段（默认保留状态）" rules={[{ required: true, message: '必填' }]} />
                    <FormInput field="reset" initValue="初始值" label="条件字段（keepState={false}）" keepState={false} />
                </>
            )}
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
