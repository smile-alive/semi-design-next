import { Form } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form onSubmit={(values) => console.log(values)} style={{ width: 400 }}>
            <Form.Input field="name" label="姓名" trigger="blur" noLabel style={{ width: 250 }} placeholder="请输入姓名" />
            <Form.Input field="purename" pure placeholder="DOM结构与普通 Input 组件完全一致" />
        </Form>
    );
}
