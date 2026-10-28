import { Form, FormInput } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form onChange={(v) => console.log(v)} onSubmit={(v) => console.log(v)} style={{ width: '600px' }} labelPosition="left" labelWidth={100}>
            <FormInput field="特效名称" style={{ width: '250px' }} />
            <Form.Slot label={{ text: 'SlotA' }} error="我是SlotA的ErrorMessage">
                <div style={{ display: 'flex', 'align-items': 'center', height: '32px', 'margin-top': '8px' }}>我是Semi Form SlotA, 我是自定义的节点</div>
            </Form.Slot>
            <Form.Slot label={{ text: 'SlotB', width: 160, align: 'right' }}>
                <div style={{ display: 'flex', 'align-items': 'center', height: '100%' }}>我是Semi Form SlotB, 我的Label Align、Width与众不同</div>
            </Form.Slot>
        </Form>
    );
}
