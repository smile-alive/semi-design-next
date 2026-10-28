import { Button } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="outline" type="primary" style={{ 'margin-right': '8px' }}>
                主要
            </Button>
            <Button theme="outline" type="secondary" style={{ 'margin-right': '8px' }}>
                次要
            </Button>
            <Button theme="outline" type="tertiary" style={{ 'margin-right': '8px' }}>
                第三
            </Button>
            <Button theme="outline" type="warning" style={{ 'margin-right': '8px' }}>
                警告
            </Button>
            <Button theme="outline" type="danger" style={{ 'margin-right': '8px' }}>
                危险
            </Button>
        </>
    );
}
