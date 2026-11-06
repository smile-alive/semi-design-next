<script lang="ts">
    import { AutoComplete, DatePicker, Input, InputGroup, InputNumber, Select } from '@fibrae/semi-ui-svelte';

    const addressData = ['Beijing Haidian'];
    const addressTypes = [
        { value: 'home', label: 'Home' },
        { value: 'work', label: 'Work' },
    ];
    const accountActions = [
        { value: 'signup', label: 'Sign Up' },
        { value: 'signin', label: 'Sign In' },
    ];
</script>

<div>
    <InputGroup>
        <Input placeholder="Name" style="width: 100px" />
        <InputNumber placeholder="Score" style="width: 140px" />
    </InputGroup>
    <br />
    <br />
    <br />
    <InputGroup size="small">
        <Select aria-label="Address type" optionList={addressTypes} style="width: 100px" value="home" />
        <AutoComplete data={addressData} placeholder="Address: " style="width: 180px" />
    </InputGroup>
    <br />
    <br />
    <br />
    <InputGroup size="small">
        <Select aria-label="Account action" optionList={accountActions} style="width: 100px" value="signup" />
        <Input placeholder="Email" style="width: 180px" />
    </InputGroup>
    <br />
    <br />
    <br />
    <InputGroup size="small">
        <Input placeholder="Name" style="width: 100px" />
        <DatePicker placeholder="Birthday" />
    </InputGroup>
</div>
