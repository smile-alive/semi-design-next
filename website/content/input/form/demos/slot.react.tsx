import { Form, FormInput, FormSlot } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form onChange={(v) => console.log(v)} onSubmit={(v) => console.log(v)} style={{ width: 600 }} labelPosition="left" labelWidth={100}>
            <FormInput field="特效名称" style={{ width: 250 }} />
            <FormSlot label={{ text: 'SlotA' }} error="我是SlotA的ErrorMessage">
                <div style={{ display: 'flex', alignItems: 'center', height: 32, marginBlockStart: 8 }}>我是Semi Form SlotA, 我是自定义的节点</div>
            </FormSlot>
            <FormSlot label={{ text: 'SlotB', width: 160, align: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>我是Semi Form SlotB, 我的Label Align、Width与众不同</div>
            </FormSlot>
        </Form>
    );
}
