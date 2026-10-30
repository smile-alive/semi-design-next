<script lang="ts">
    import { Button, Form, FormInput, FormSelect, Row, type FormApi } from '@fibrae/semi-ui-svelte';

    let formApi: FormApi | undefined;

    const sexOptions = [
        { label: 'female', value: 'female' },
        { label: 'male', value: 'male' },
    ];

    const handleSelectChange = (value: unknown) => {
        const text = value === 'male' ? 'Hi male' : 'Hi female!';
        formApi?.setValue('Note', text);
    };
</script>

<Form getFormApi={(api) => (formApi = api)} onValueChange={(values) => console.log(values)} style="width: 250px">
    <span>Note will change after Sex select</span>
    <FormInput field="Note" style="width: 250px" />
    <FormSelect field="Sex" onChange={handleSelectChange} optionList={sexOptions} style="width: 250px" />
    <Row>
        <Button class="btn-margin-right" htmlType="submit" type="primary">Submit</Button>
        <Button htmlType="reset">reset</Button>
    </Row>
</Form>
