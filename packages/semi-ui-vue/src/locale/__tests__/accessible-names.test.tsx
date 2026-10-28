/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen, within } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { IconUser } from '@fibrae/semi-icons-vue';
import { mockResizeObserver, render } from '@test/utils/vue';
import Anchor, { AnchorLink } from '../../anchor';
import AudioPlayer from '../../audio-player';
import Avatar from '../../avatar';
import AvatarGroup from '../../avatar/avatar-group.vue';
import Breadcrumb from '../../breadcrumb';
import Cascader from '../../cascader';
import Feedback from '../../feedback';
import JsonViewer from '../../json-viewer';
import Table from '../../table';
import Transfer from '../../transfer';
import Tree from '../../tree';
import TreeSelect from '../../tree-select';
import Upload, { type FileItem } from '../../upload';
import UserGuide from '../../user-guide';
import VideoPlayer from '../../video-player';
import LocaleProvider from '../locale-provider.vue';
import AccessibleNames from './fixtures/accessible-names.vue';

// jsdom has no Worker, so the editor core is faked; only the search bar names are under test here
vi.mock('@fibrae/semi-json-viewer-core', () => {
    class JsonViewer {
        emitter = { on: () => {}, emit: () => {} };
        searchWidget = { search: () => {}, clear: () => {}, searchResults: [] };
        layout = () => {};
        format = () => {};
        resetMeasuredHeights = () => {};
        dispose = () => {};
        getModel = () => ({ getValue: () => '' });
        getSearchWidget = () => this.searchWidget;
    }
    return { JsonViewer };
});

describe('可访问名称跟随语言包', () => {
    it('Spin 使用日语名称，语言切换与 ConfigProvider 优先级即时生效', async () => {
        expect(ja_JP.Spin.loading).not.toBe(en_US.Spin.loading);
        const view = render(AccessibleNames, { props: { locale: ja_JP } });
        expect(view.getByRole('status', { name: ja_JP.Spin.loading })).toBeInTheDocument();
        await view.rerender({ configLocale: en_US });
        expect(view.getByRole('status', { name: en_US.Spin.loading })).toBeInTheDocument();
        await view.rerender({ configLocale: null });
        expect(view.getByRole('status', { name: ja_JP.Spin.loading })).toBeInTheDocument();
    });

    it('AvatarGroup 的剩余头像名称使用日语模板并跟随语言更新', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => (
                    <AvatarGroup maxCount={1}>
                        {{
                            default: () => (
                                <>
                                    <Avatar alt="a" />
                                    <Avatar alt="b" />
                                </>
                            ),
                        }}
                    </AvatarGroup>
                ),
            },
        });
        expect(view.getByRole('img', { name: `${ja_JP.Avatar.more.replace('${count}', '1')}: b` })).toBeInTheDocument();
        await view.rerender({ locale: en_US });
        expect(view.getByRole('img', { name: `${en_US.Avatar.more.replace('${count}', '1')}: b` })).toBeInTheDocument();
    });

    it('Breadcrumb 的导航与「更多」名称使用日语并跟随语言更新', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Breadcrumb routes={['a', 'b', 'c', 'd', 'e']} /> },
        });
        expect(view.getByRole('navigation', { name: ja_JP.Breadcrumb.label })).toBeInTheDocument();
        expect(view.getByRole('button', { name: ja_JP.Breadcrumb.expand })).toBeInTheDocument();
        await view.rerender({ locale: en_US });
        expect(view.getByRole('navigation', { name: en_US.Breadcrumb.label })).toBeInTheDocument();
        expect(view.getByRole('button', { name: en_US.Breadcrumb.expand })).toBeInTheDocument();
    });

    it('Anchor 根元素名称使用日语并跟随语言更新', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => (
                    <Anchor>
                        {{
                            default: () => <AnchorLink href="#a" title="a" />,
                        }}
                    </Anchor>
                ),
            },
        });
        expect(view.getByRole('navigation', { name: ja_JP.Anchor.label })).toBeInTheDocument();
        await view.rerender({ locale: en_US });
        expect(view.getByRole('navigation', { name: en_US.Anchor.label })).toBeInTheDocument();
    });

    it('Cascader 的 combobox、清除按钮与空状态文案使用日语并跟随语言更新', async () => {
        const treeData = [{ label: 'a', value: 'a', key: 'a' }];
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => (
                    <>
                        <Cascader treeData={treeData} defaultValue={['a']} showClear />
                        <Cascader treeData={[]} defaultOpen />
                    </>
                ),
            },
        });
        expect(view.getAllByRole('combobox', { name: ja_JP.Cascader.label })).toHaveLength(2);
        expect(await view.findByRole('button', { name: ja_JP.Cascader.clear })).toBeInTheDocument();
        expect(document.body).toHaveTextContent(ja_JP.Cascader.emptyText);
        await view.rerender({ locale: en_US });
        expect(view.getAllByRole('combobox', { name: en_US.Cascader.label })).toHaveLength(2);
        expect(view.getByRole('button', { name: en_US.Cascader.clear })).toBeInTheDocument();
        expect(document.body).toHaveTextContent(en_US.Cascader.emptyText);
    });

    it('Table 为筛选按钮命名', () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => <Table columns={[{ title: 'a', dataIndex: 'a', filters: [{ text: 'x', value: 'x' }], onFilter: () => true }]} dataSource={[{ key: '1', a: 'x' }]} />,
            },
        });
        expect(view.getByRole('button', { name: ja_JP.Table.filterColumn })).toBeInTheDocument();
    });

    it('Table 的筛选按钮在筛选生效时换用生效状态的名称', () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => (
                    <Table
                        columns={[
                            {
                                title: 'a',
                                dataIndex: 'a',
                                filters: [{ text: 'x', value: 'x' }],
                                filteredValue: ['x'],
                                onFilter: () => true,
                            },
                        ]}
                        dataSource={[{ key: '1', a: 'x' }]}
                    />
                ),
            },
        });
        expect(view.getByRole('button', { name: ja_JP.Table.filterColumnActive })).toBeInTheDocument();
    });

    it('Table 为选择复选框与展开按钮命名', () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => (
                    <Table columns={[{ title: 'a', dataIndex: 'a' }]} dataSource={[{ key: '1', a: 1 }]} rowSelection={{}}>
                        {{ expandedRow: () => 'more' }}
                    </Table>
                ),
            },
        });
        expect(view.getByRole('checkbox', { name: ja_JP.Table.selectAllRows })).toBeInTheDocument();
        expect(view.getByRole('checkbox', { name: ja_JP.Table.selectRow })).toBeInTheDocument();
        expect(view.getByRole('button', { name: ja_JP.Table.expandRow })).toBeInTheDocument();
    });

    it('Tree 为筛选输入框命名', () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => <Tree filterTreeNode treeData={[{ label: 'A', value: 'a', key: 'a' }]} />,
            },
        });
        expect(view.getByRole('textbox', { name: ja_JP.Tree.filter })).toBeInTheDocument();
    });

    it('TreeSelect 为搜索输入框命名', () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => <TreeSelect multiple filterTreeNode searchPosition="trigger" treeData={[{ label: 'A', value: 'a', key: 'a' }]} />,
            },
        });
        expect(view.getByRole('combobox', { name: ja_JP.TreeSelect.label }).tagName).toBe('INPUT');
    });

    it('Transfer 为列表、筛选框与已选项的删除按钮命名', () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => <Transfer defaultValue={['1']} dataSource={[{ key: '1', label: 'A', value: '1' }]} />,
            },
        });
        expect(view.getByRole('list', { name: ja_JP.Transfer.optionList })).toBeInTheDocument();
        expect(view.getByRole('list', { name: ja_JP.Transfer.selectedList })).toBeInTheDocument();
        // jsdom's role table has no implicit role for the native search element
        expect(document.querySelector('search')).toHaveAttribute('aria-label', ja_JP.Transfer.filter);
        expect(view.getByRole('button', { name: ja_JP.Transfer.remove })).toBeInTheDocument();
    });

    it('可拖拽的 Transfer 为排序手柄命名并给出角色描述与键盘说明', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => <Transfer defaultValue={['1']} dataSource={[{ key: '1', label: 'A', value: '1' }]} draggable />,
            },
        });
        // the static stand-in has the same name; the role description comes once the sortable list has loaded
        await vi.waitFor(() => expect(view.getByRole('button', { name: ja_JP.Transfer.dragSort })).toHaveAttribute('aria-roledescription', ja_JP.Sortable.roleDescription));
        await vi.waitFor(() => expect(view.getByRole('button', { name: ja_JP.Transfer.dragSort })).toHaveAccessibleDescription(ja_JP.Sortable.instructions));
    });

    it('Upload 为文件列表、图片列表与删除按钮命名', () => {
        const defaultFileList: FileItem[] = [{ uid: '1', name: 'a.txt', status: 'success', size: '1KB', url: 'a.txt' }];
        const file = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Upload action="/" defaultFileList={defaultFileList} /> },
        });
        expect(file.getByRole('list', { name: ja_JP.Upload.fileList })).toBeInTheDocument();
        expect(file.getByRole('button', { name: ja_JP.Upload.remove })).toBeInTheDocument();
        file.unmount();
        const picture = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Upload action="/" defaultFileList={defaultFileList} listType="picture" /> },
        });
        expect(picture.getByRole('list', { name: ja_JP.Upload.pictureList })).toBeInTheDocument();
        expect(picture.getByRole('button', { name: ja_JP.Upload.remove })).toBeInTheDocument();
    });

    it('Upload 的图片墙添加按钮只有图标时用语言包兜底命名', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => (
                    <Upload action="/" listType="picture">
                        {{
                            default: () => <IconUser />,
                        }}
                    </Upload>
                ),
            },
        });
        await nextTick();
        expect(view.getByRole('button', { name: ja_JP.Upload.upload })).toBeInTheDocument();
    });

    it('JsonViewer 的搜索栏、搜索框与替换框使用日语名称', async () => {
        mockResizeObserver();
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <JsonViewer modelValue="1" /> },
        });
        await fireEvent.click(view.getByRole('button', { name: ja_JP.JsonViewer.search }));
        expect(view.getByRole('textbox', { name: ja_JP.JsonViewer.search })).toBeInTheDocument();
        expect(view.getByRole('textbox', { name: ja_JP.JsonViewer.replace })).toBeInTheDocument();
    });

    it('UserGuide 的按钮使用日语文案', async () => {
        const target = document.body.appendChild(document.createElement('div'));
        target.getBoundingClientRect = () => new DOMRect(10, 20, 100, 30);
        const steps = [
            { target, title: 'A' },
            { target, title: 'B' },
        ];
        const first = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <UserGuide steps={steps} visible current={0} /> },
        });
        expect(await screen.findByRole('button', { name: ja_JP.UserGuide.next })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja_JP.UserGuide.skip })).toBeInTheDocument();
        first.unmount();
        const last = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <UserGuide steps={steps} visible current={1} /> },
        });
        expect(await screen.findByRole('button', { name: ja_JP.UserGuide.prev })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja_JP.UserGuide.finish })).toBeInTheDocument();
        last.unmount();
        target.remove();
    });

    it('Feedback 的输入框占位与提交按钮使用日语', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Feedback type="text" title="T" visible /> },
        });
        await nextTick();
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', ja_JP.Feedback.placeholder);
        expect(screen.getByRole('button', { name: ja_JP.Feedback.submit })).toBeInTheDocument();
        view.unmount();
    });

    it('AudioPlayer 与 VideoPlayer 的倍速、清晰度、线路按钮名称使用日语用途并跟随语言更新', async () => {
        const players = () => (
            <>
                <AudioPlayer audioUrl="https://example.com/a.mp3" />
                <VideoPlayer src="https://example.com/a.mp4" defaultQuality="1080p" qualityList={[{ label: '1080P', value: '1080p' }]} routeList={[{ label: 'Line 1', value: 'line1' }]} />
            </>
        );
        const expectNames = (locale: typeof ja_JP) => {
            const rates = screen.getAllByRole('button', { name: `${locale.VideoPlayer.playbackRate} 1.0x` });
            expect(rates).toHaveLength(locale.AudioPlayer.playbackRate === locale.VideoPlayer.playbackRate ? 2 : 1);
            expect(screen.getAllByRole('button', { name: `${locale.AudioPlayer.playbackRate} 1.0x` })).not.toHaveLength(0);
            expect(screen.getByRole('button', { name: `${locale.VideoPlayer.quality} 1080P` })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: locale.VideoPlayer.route })).toBeInTheDocument();
        };
        expect(ja_JP.VideoPlayer.quality).not.toBe(en_US.VideoPlayer.quality);
        const view = render(LocaleProvider, { props: { locale: ja_JP }, slots: { default: players } });
        expectNames(ja_JP);
        await view.rerender({ locale: en_US });
        expectNames(en_US);
    });

    it('Feedback 的 emoji 评分组与选项使用日语名称', async () => {
        const view = render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Feedback type="emoji" title="T" visible /> },
        });
        await nextTick();
        const group = screen.getByRole('radiogroup', { name: ja_JP.Feedback.rating });
        expect(within(group).getByRole('radio', { name: ja_JP.Feedback.good })).toBeInTheDocument();
        view.unmount();
    });
});
