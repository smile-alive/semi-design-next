import { IconSearch } from '@fibrae/semi-icons-solid';
import { Input, Typography } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    return (
        <>
            <Input aria-label="Search" prefix={<IconSearch />} showClear />
            <br />
            <br />
            <Input aria-label="Input with text prefix" prefix="Prefix" showClear />
            <br />
            <br />
            <Input aria-label="Search" suffix={<IconSearch />} showClear />
            <br />
            <br />
            <Input
                aria-label="Input with text suffix"
                suffix={
                    <Typography.Text strong type="secondary" style={{ 'margin-right': '8px' }}>
                        Suffix
                    </Typography.Text>
                }
                showClear
            />
        </>
    );
}
