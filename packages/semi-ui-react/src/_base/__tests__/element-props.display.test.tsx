import type { ReactElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import {
    AudioPlayer,
    Calendar,
    Carousel,
    CardGroup,
    CodeHighlight,
    Collapse,
    Descriptions,
    ImagePreview,
    List,
    Lottie,
    MarkdownRender,
    OverflowList,
    Progress,
    Resizable,
    ResizeGroup,
    ResizeHandler,
    ResizeItem,
    ScrollItem,
    ScrollList,
    Skeleton,
    Spin,
    SplitTagGroup,
    Table,
    Tag,
    TagGroup,
    Timeline,
    Tree,
    Typography,
    VideoPlayer,
} from '@fibrae/semi-ui-react';
import Collapsible from '@fibrae/semi-ui-react/collapsible';

// Literal JSX attributes on purpose: spread props skip the excess-property check (F6 type half); runtime checks F2.
const onKeyDown = vi.fn<() => void>();
// [name, element, class of the receiving element (null: none), id lands on it]
const cases: [string, () => ReactElement, string | null, boolean][] = [
    ['Calendar', () => <Calendar id="probe" data-probe="" onKeyDown={onKeyDown} />, 'calendar-week', true],
    [
        'Carousel',
        () => (
            <Carousel id="probe" data-probe="" onKeyDown={onKeyDown}>
                <div>slide</div>
            </Carousel>
        ),
        'carousel',
        true,
    ],
    ['Collapse', () => <Collapse id="probe" data-probe="" onKeyDown={onKeyDown} />, 'collapse', true],
    [
        'Collapse.Panel',
        () => (
            <Collapse>
                <Collapse.Panel id="probe" data-probe="" header="h" itemKey="1" onKeyDown={onKeyDown}>
                    body
                </Collapse.Panel>
            </Collapse>
        ),
        'collapse-item',
        true,
    ],
    // id goes to the inner content div, not the wrapper
    ['Collapsible', () => <Collapsible data-probe="" isOpen onKeyDown={onKeyDown} />, 'collapsible-wrapper', false],
    ['Descriptions', () => <Descriptions id="probe" data-probe="" data={[{ key: 'k', value: 'v' }]} onKeyDown={onKeyDown} />, 'descriptions', true],
    [
        'Descriptions.Item',
        () => (
            <Descriptions>
                <Descriptions.Item id="probe" data-probe="" itemKey="k" onKeyDown={onKeyDown}>
                    v
                </Descriptions.Item>
            </Descriptions>
        ),
        null,
        true,
    ],
    ['List', () => <List id="probe" data-probe="" onKeyDown={onKeyDown} />, 'list', true],
    [
        'List.Item',
        () => (
            <List>
                <List.Item id="probe" data-probe="" onKeyDown={onKeyDown}>
                    item
                </List.Item>
            </List>
        ),
        'list-item',
        true,
    ],
    ['Table', () => <Table id="probe" data-probe="" columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'a' }]} pagination={false} onKeyDown={onKeyDown} />, 'table-wrapper', true],
    ['Tag', () => <Tag id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'tag', true],
    ['TagGroup', () => <TagGroup id="probe" data-probe="" title="t" tagList={[{ children: 'a' }]} onKeyDown={onKeyDown} />, 'tag-group', true],
    [
        'SplitTagGroup',
        () => (
            <SplitTagGroup id="probe" data-probe="" title="t" onKeyDown={onKeyDown}>
                <Tag>a</Tag>
            </SplitTagGroup>
        ),
        'tag-split',
        true,
    ],
    ['Timeline', () => <Timeline id="probe" data-probe="" onKeyDown={onKeyDown} />, 'timeline', true],
    [
        'Timeline.Item',
        () => (
            <Timeline>
                <Timeline.Item id="probe" data-probe="" onKeyDown={onKeyDown}>
                    event
                </Timeline.Item>
            </Timeline>
        ),
        'timeline-item',
        true,
    ],
    ['Tree', () => <Tree id="probe" data-probe="" treeData={[{ key: 'a', label: 'a' }]} onKeyDown={onKeyDown} />, 'tree-wrapper', true],
    ['Typography', () => <Typography id="probe" data-probe="" onKeyDown={onKeyDown} />, 'typography', true],
    ['Typography.Title', () => <Typography.Title id="probe" data-probe="" onKeyDown={onKeyDown} />, 'typography', true],
    ['Typography.Text', () => <Typography.Text id="probe" data-probe="" onKeyDown={onKeyDown} />, 'typography', true],
    ['Typography.Paragraph', () => <Typography.Paragraph id="probe" data-probe="" onKeyDown={onKeyDown} />, 'typography', true],
    ['Typography.Numeral', () => <Typography.Numeral id="probe" data-probe="" onKeyDown={onKeyDown} />, 'typography', true],
    ['Skeleton', () => <Skeleton id="probe" data-probe="" onKeyDown={onKeyDown} />, 'skeleton', true],
    ['Skeleton.Avatar', () => <Skeleton.Avatar id="probe" data-probe="" onKeyDown={onKeyDown} />, 'skeleton-avatar', true],
    ['Skeleton.Title', () => <Skeleton.Title id="probe" data-probe="" onKeyDown={onKeyDown} />, 'skeleton-title', true],
    ['Skeleton.Button', () => <Skeleton.Button id="probe" data-probe="" onKeyDown={onKeyDown} />, 'skeleton-button', true],
    ['Skeleton.Paragraph', () => <Skeleton.Paragraph id="probe" data-probe="" onKeyDown={onKeyDown} />, 'skeleton-paragraph', true],
    ['Skeleton.Image', () => <Skeleton.Image id="probe" data-probe="" onKeyDown={onKeyDown} />, 'skeleton-image', true],
    ['Progress', () => <Progress id="probe" data-probe="" onKeyDown={onKeyDown} />, 'progress', true],
    ['Spin', () => <Spin id="probe" data-probe="" onKeyDown={onKeyDown} />, 'spin', true],
    ['OverflowList', () => <OverflowList id="probe" data-probe="" items={[]} onKeyDown={onKeyDown} />, 'overflow-list', true],
    ['ScrollList', () => <ScrollList id="probe" data-probe="" onKeyDown={onKeyDown} />, 'scrolllist', true],
    ['ScrollList.Item (ScrollItem)', () => <ScrollItem id="probe" data-probe="" list={[{ value: 1, text: '1' }]} onKeyDown={onKeyDown} />, 'scrolllist-item-wheel', true],
    ['ImagePreview', () => <ImagePreview id="probe" data-probe="" onKeyDown={onKeyDown} />, 'image-preview-group', true],
    ['CardGroup', () => <CardGroup id="probe" data-probe="" onKeyDown={onKeyDown} />, 'card-group', true],
    ['Resizable', () => <Resizable id="probe" data-probe="" onKeyDown={onKeyDown} />, 'resizable-resizable', true],
    [
        'ResizeGroup',
        () => (
            <ResizeGroup id="probe" style={{ width: 320 }} data-probe="" direction="horizontal" onKeyDown={onKeyDown}>
                <ResizeItem>a</ResizeItem>
            </ResizeGroup>
        ),
        'resizable-group',
        true,
    ],
    [
        'ResizeItem',
        () => (
            <ResizeGroup direction="horizontal">
                <ResizeItem id="probe" data-probe="" onKeyDown={onKeyDown}>
                    a
                </ResizeItem>
            </ResizeGroup>
        ),
        'resizable-item',
        true,
    ],
    ['MarkdownRender', () => <MarkdownRender id="probe" data-probe="" raw="text" onKeyDown={onKeyDown} />, 'markdownRender', true],
    ['CodeHighlight', () => <CodeHighlight id="probe" data-probe="" code="a" language="js" onKeyDown={onKeyDown} />, 'codeHighlight', true],
    ['AudioPlayer', () => <AudioPlayer id="probe" data-probe="" audioUrl="https://localhost/a.mp3" onKeyDown={onKeyDown} />, 'audio-player', true],
    ['VideoPlayer', () => <VideoPlayer id="probe" data-probe="" src="https://localhost/a.mp4" onKeyDown={onKeyDown} />, 'videoPlayer', true],
    ['Lottie', () => <Lottie id="probe" data-probe="" params={{}} onKeyDown={onKeyDown} />, 'lottie', true],
];

describe('未声明属性落在根元素上，且 Props 类型接受', () => {
    it.each(cases)('%s', (_, renderElement, cls, hasId) => {
        onKeyDown.mockClear();
        const { container } = render(renderElement());
        const root = container.querySelector<HTMLElement>('[data-probe]');
        expect(root.className).toContain(cls ? `${BASE_CLASS_PREFIX}-${cls}` : '');
        expect(root.id).toBe(hasId ? 'probe' : '');
        fireEvent.keyDown(root, { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('ResizeHandler', () => {
        onKeyDown.mockClear();
        const { container } = render(
            <ResizeGroup direction="horizontal">
                <ResizeItem>a</ResizeItem>
                <ResizeHandler id="probe" data-probe="" onKeyDown={onKeyDown} />
                <ResizeItem>b</ResizeItem>
            </ResizeGroup>
        );
        const root = container.querySelector<HTMLElement>('[data-probe]');
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-resizable-handler`);
        expect(root).toHaveAttribute('id', 'probe');
        fireEvent.keyDown(root, { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('ResizeGroup 合并调用方的 style', () => {
        const { container } = render(
            <ResizeGroup style={{ width: 320 }} data-probe="" direction="vertical">
                <ResizeItem>a</ResizeItem>
            </ResizeGroup>
        );
        expect(container.querySelector('[data-probe]')).toHaveStyle({ width: '320px', flexDirection: 'column' });
    });
});
