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
    const nameStyle = 'width: 100px';
    const scoreStyle = 'width: 140px';
    const selectStyle = 'width: 100px';
    const wideStyle = 'width: 180px';
</script>

<div>
    <InputGroup>
        <Input placeholder="Name" style={nameStyle} />
        <InputNumber placeholder="Score" style={scoreStyle} />
    </InputGroup>
    <br />
    <br />
    <br />
    <InputGroup size="small">
        <Select aria-label="Address type" optionList={addressTypes} style={selectStyle} value="home" />
        <AutoComplete data={addressData} placeholder="Address: " style={wideStyle} />
    </InputGroup>
    <br />
    <br />
    <br />
    <InputGroup size="small">
        <Select aria-label="Account action" optionList={accountActions} style={selectStyle} value="signup" />
        <Input placeholder="Email" style={wideStyle} />
    </InputGroup>
    <br />
    <br />
    <br />
    <InputGroup size="small">
        <Input placeholder="Name" style={nameStyle} />
        <DatePicker placeholder="Birthday" />
    </InputGroup>
</div>
