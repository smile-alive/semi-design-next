import { Anchor } from '@fibrae/semi-ui-react';

export default function AnchorDemo() {
    return (
        <Anchor size="default">
            <Anchor.Link href="#组件" title="组件" />
            <Anchor.Link href="#设计语言" title="设计语言" />
            <Anchor.Link href="#物料平台" title="物料平台" />
            <Anchor.Link href="#主题商店" title="主题商店" />
        </Anchor>
    );
}
