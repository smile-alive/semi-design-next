import { InputGroup, Input, InputNumber, AutoComplete, DatePicker, Select } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    return (
        <div>
            <InputGroup>
                <Input placeholder="Name" style={{ width: 100 }} />
                <InputNumber placeholder="Score" style={{ width: 140 }} />
            </InputGroup>
            <br />
            <br />
            <br />
            <InputGroup size="small">
                <Select aria-label="Address type" style={{ width: '100px' }} defaultValue="home">
                    <Select.Option value="home">Home</Select.Option>
                    <Select.Option value="work">Work</Select.Option>
                </Select>
                <AutoComplete data={['Beijing Haidian']} placeholder="Address: " style={{ width: 180 }} />
            </InputGroup>
            <br />
            <br />
            <br />
            <InputGroup size="small">
                <Select aria-label="Account action" style={{ width: '100px' }} defaultValue="signup">
                    <Select.Option value="signup">Sign Up</Select.Option>
                    <Select.Option value="signin">Sign In</Select.Option>
                </Select>
                <Input placeholder="Email" style={{ width: 180 }} />
            </InputGroup>
            <br />
            <br />
            <br />
            <InputGroup size="small">
                <Input placeholder="Name" style={{ width: 100 }} />
                <DatePicker placeholder="Birthday" />
            </InputGroup>
        </div>
    );
}
