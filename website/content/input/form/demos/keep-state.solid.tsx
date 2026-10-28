import { Show, createSignal } from 'solid-js';
import { Button, Form, FormInput, FormSwitch, Switch } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    const [show, setShow] = createSignal(true);

    return (
        <Form style={{ width: '450px' }}>
            <FormSwitch field="alwaysShow" label="始终显示的字段" />
            <Switch aria-labelledby="form-keep-state-toggle" checked={show()} onChange={(checked) => setShow(checked)} style={{ 'margin-bottom': '12px' }} />
            <span id="form-keep-state-toggle" style={{ 'margin-left': '8px', color: 'var(--semi-color-text-2)' }}>
                显示条件字段
            </span>
            <Show when={show()}>
                <FormInput field="conditionalField" label="条件字段（keepState）" keepState />
                <FormInput field="noKeepState" label="条件字段（无 keepState）" />
            </Show>
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
