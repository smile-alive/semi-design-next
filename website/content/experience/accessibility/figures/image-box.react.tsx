import { Empty } from '@fibrae/semi-ui-react';

export default function ImageBox({ url, alt, darkUrl }: { url: string; alt: string; darkUrl?: string }) {
    return <Empty className="imagebox" image={<img alt={alt} src={url} style={{ maxWidth: '100%' }} />} darkModeImage={darkUrl ? <img alt={alt} src={darkUrl} style={{ maxWidth: '100%' }} /> : null} />;
}
