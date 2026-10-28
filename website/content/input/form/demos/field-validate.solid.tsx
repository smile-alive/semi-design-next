import { Button, Form, FormInput } from '@fibrae/semi-ui-solid';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const validateName = (val?: string) => {
    if (!val) {
        return "【sync】can't be empty";
    } else if (val.length <= 5) {
        return '【sync】must more than 5';
    }
    return '';
};

const asyncValidate = (val?: string) =>
    sleep(2000).then(() => {
        if (!val) {
            return "【async】can't be empty";
        } else if (val.length <= 5) {
            return '【async】must more than 5';
        } else {
            return '';
        }
    });

export default function FormDemo() {
    return (
        <Form>
            <FormInput field="name" label="【name】asyncValidate after 2s" validator={asyncValidate} trigger="blur" />
            <FormInput field="familyName" label="【familyName】syncValidate" validator={validateName} trigger="blur" />
            <Button htmlType="reset">reset</Button>
        </Form>
    );
}
