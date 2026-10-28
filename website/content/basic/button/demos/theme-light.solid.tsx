import { Button } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="light" type="primary" style={{ 'margin-right': '8px' }}>
                浅色主要
            </Button>
            <Button theme="light" type="secondary" style={{ 'margin-right': '8px' }}>
                浅色次要
            </Button>
            <Button theme="light" type="tertiary" style={{ 'margin-right': '8px' }}>
                浅色第三
            </Button>
            <Button theme="light" type="warning" style={{ 'margin-right': '8px' }}>
                浅色警告
            </Button>
            <Button theme="light" type="danger" style={{ 'margin-right': '8px' }}>
                浅色危险
            </Button>
        </>
    );
}
