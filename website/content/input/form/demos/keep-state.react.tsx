import React from 'react';
import { Form, Switch, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const [show, setShow] = React.useState(true);

    return (
        <Form style={{ width: 450 }}>
            <Form.Switch field="alwaysShow" label="始终显示的字段" />
            <Switch aria-labelledby="form-keep-state-toggle" checked={show} onChange={setShow} style={{ marginBottom: 12 }} />
            <span id="form-keep-state-toggle" style={{ marginLeft: 8, color: 'var(--semi-color-text-2)' }}>
                显示条件字段
            </span>
            {show && <Form.Input field="conditionalField" label="条件字段（keepState）" keepState />}
            {show && <Form.Input field="noKeepState" label="条件字段（无 keepState）" />}
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
