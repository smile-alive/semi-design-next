import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="outline" type="primary" style={{ marginRight: 8 }}>
                主要
            </Button>
            <Button theme="outline" type="secondary" style={{ marginRight: 8 }}>
                次要
            </Button>
            <Button theme="outline" type="tertiary" style={{ marginRight: 8 }}>
                第三
            </Button>
            <Button theme="outline" type="warning" style={{ marginRight: 8 }}>
                警告
            </Button>
            <Button theme="outline" type="danger" style={{ marginRight: 8 }}>
                危险
            </Button>
        </>
    );
}
