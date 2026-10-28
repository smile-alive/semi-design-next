import { Button } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <div>
            <Button size="large" style={{ 'margin-right': '8px' }}>
                大尺寸
            </Button>
            <Button size="default" style={{ 'margin-right': '8px' }}>
                默认尺寸
            </Button>
            <Button size="small">小尺寸</Button>
        </div>
    );
}
