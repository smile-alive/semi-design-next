import { Form, FormInput } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form onSubmit={(values) => console.log(values)} style={{ width: '400px' }}>
            <FormInput field="name" label="姓名" trigger="blur" noLabel style={{ width: '250px' }} placeholder="请输入姓名" />
            <FormInput field="purename" pure placeholder="DOM结构与普通 Input 组件完全一致" />
        </Form>
    );
}
