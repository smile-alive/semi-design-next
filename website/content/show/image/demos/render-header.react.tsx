import { useMemo } from 'react';
import { Image, ImagePreview } from '@fibrae/semi-ui-react';

export default function ImageDemo() {
    const srcList = useMemo(() => ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg'], []);

    return (
        <>
            <ImagePreview
                renderHeader={(title) => (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span style={{ background: 'black', padding: '0 10px' }}>自定义标题：{title}</span>
                    </div>
                )}
            >
                <div>
                    {srcList.map((src, index) => {
                        return (
                            <Image
                                key={index}
                                src={src}
                                width={200}
                                alt={`lamp${index + 1}`}
                                preview={{
                                    previewTitle: `lamp${index + 1}`,
                                }}
                                style={{ marginRight: 5 }}
                            />
                        );
                    })}
                </div>
            </ImagePreview>
        </>
    );
}
