import { JsonViewer } from '@fibrae/semi-ui-solid';

const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;

export default function JsonViewerDemo() {
    return (
        <div>
            <div style={{ 'margin-bottom': '12px', overflow: 'hidden' }}>
                <JsonViewer height={100} width={700} value={data} options={{ lineHeight: 20 }} />
            </div>
            <div style={{ 'margin-bottom': '12px', overflow: 'hidden' }}>
                <JsonViewer height={120} width={700} value={data} options={{ lineHeight: 24 }} />
            </div>
            <div style={{ 'margin-bottom': '12px', overflow: 'hidden' }}>
                <JsonViewer height={120} width={700} value={data} options={{ lineHeight: 26 }} />
            </div>
        </div>
    );
}
