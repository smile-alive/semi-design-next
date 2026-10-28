import { JsonViewer } from '@fibrae/semi-ui-solid';

const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;

export default function JsonViewerDemo() {
    return (
        <div style={{ 'margin-bottom': '16px' }}>
            <JsonViewer height={100} width={700} value={data} />
        </div>
    );
}
