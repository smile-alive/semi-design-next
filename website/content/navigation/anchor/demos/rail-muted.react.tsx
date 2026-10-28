import { Anchor } from '@fibrae/semi-ui-react';

export default function AnchorDemo() {
    return (
        <div>
            <Anchor railTheme="muted" targetOffset={60} offsetTop={100}>
                <Anchor.Link href="#尺寸" title="尺寸" />
                <Anchor.Link href="#滑轨主题" title="滑轨主题" />
                <Anchor.Link href="#设计语言" title="设计语言" />
                <Anchor.Link href="#物料平台" title="物料平台" />
                <Anchor.Link href="#主题商店" title="主题商店" />
            </Anchor>
        </div>
    );
}
