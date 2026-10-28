import { Button } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="solid" type="primary" style={{ 'margin-right': '8px' }}>
                深色主要
            </Button>
            <Button theme="solid" type="secondary" style={{ 'margin-right': '8px' }}>
                深色次要
            </Button>
            <Button theme="solid" type="tertiary" style={{ 'margin-right': '8px' }}>
                深色第三
            </Button>
            <Button theme="solid" type="warning" style={{ 'margin-right': '8px' }}>
                深色警告
            </Button>
            <Button theme="solid" type="danger" style={{ 'margin-right': '8px' }}>
                深色危险
            </Button>
        </>
    );
}
