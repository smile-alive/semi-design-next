import { Form, FormInput, type FormRenderProps } from '@fibrae/semi-ui-solid';

function Fields(props: FormRenderProps) {
    return (
        <>
            <FormInput field="Role" style={{ width: '176px' }} />
            <FormInput field="UserName" style={{ width: '80px' }} />
            <FormInput field="Password" style={{ width: '176px' }} />
            <code style={{ 'margin-top': '24px' }}>{JSON.stringify(props.formState)}</code>
        </>
    );
}

export default function FormDemo() {
    return <Form component={Fields} layout="horizontal" onValueChange={(values) => console.log(values)} />;
}
