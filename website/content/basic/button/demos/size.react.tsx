import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <div>
            <Button size="large" style={{ marginRight: 8 }}>
                大尺寸
            </Button>
            <Button size="default" style={{ marginRight: 8 }}>
                默认尺寸
            </Button>
            <Button size="small">小尺寸</Button>
        </div>
    );
}
