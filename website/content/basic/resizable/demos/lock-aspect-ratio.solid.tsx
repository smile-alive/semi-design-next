import { Resizable } from '@fibrae/semi-ui-solid';

export default function ResizableDemo() {
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Resizable
                style={{ 'background-color': 'var(--semi-grey-1)', 'margin-block-end': '10px' }}
                defaultSize={{
                    width: 400,
                    height: 300,
                }}
                lockAspectRatio
            >
                <div style={{ 'margin-inline-start': '20%' }}>lock</div>
            </Resizable>
            <Resizable
                style={{ 'background-color': 'var(--semi-grey-1)' }}
                defaultSize={{
                    width: 200,
                    height: (200 * 9) / 16,
                }}
                lockAspectRatio={16 / 9}
            >
                <div style={{ 'margin-inline-start': '20%' }}>16 / 9</div>
            </Resizable>
        </div>
    );
}
