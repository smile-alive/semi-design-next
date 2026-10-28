import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import Anchor from '@fibrae/semi-ui-react/anchor';
import AudioPlayer from '@fibrae/semi-ui-react/audio-player';
import Avatar from '@fibrae/semi-ui-react/avatar';
import AvatarGroup from '@fibrae/semi-ui-react/avatar/avatar-group';
import BackTop from '@fibrae/semi-ui-react/backtop';
import Banner from '@fibrae/semi-ui-react/banner';
import Breadcrumb from '@fibrae/semi-ui-react/breadcrumb';
import Carousel from '@fibrae/semi-ui-react/carousel';
import Cascader from '@fibrae/semi-ui-react/cascader';
import ColorPicker from '@fibrae/semi-ui-react/color-picker';
import Cropper from '@fibrae/semi-ui-react/cropper';
import DatePicker from '@fibrae/semi-ui-react/date-picker';
import Image from '@fibrae/semi-ui-react/image';
import Input from '@fibrae/semi-ui-react/input';
import InputGroup from '@fibrae/semi-ui-react/input/input-group';
import NotificationItem from '@fibrae/semi-ui-react/notification/notice';
import Pagination from '@fibrae/semi-ui-react/pagination';
import Rating from '@fibrae/semi-ui-react/rating';
import Select from '@fibrae/semi-ui-react/select';
import SideSheet from '@fibrae/semi-ui-react/side-sheet';
import Slider from '@fibrae/semi-ui-react/slider';
import Table from '@fibrae/semi-ui-react/table';
import Tabs from '@fibrae/semi-ui-react/tabs';
import TabPane from '@fibrae/semi-ui-react/tabs/tab-pane';
import Tag from '@fibrae/semi-ui-react/tag';
import TagInput from '@fibrae/semi-ui-react/tag-input';
import Toast from '@fibrae/semi-ui-react/toast/toast';
import Transfer from '@fibrae/semi-ui-react/transfer';
import Tree from '@fibrae/semi-ui-react/tree';
import TreeSelect from '@fibrae/semi-ui-react/tree-select';
import Upload from '@fibrae/semi-ui-react/upload';
import type { FileItem } from '@fibrae/semi-ui-react/upload/interface';
import VideoPlayer from '@fibrae/semi-ui-react/video-player';
import LocaleProvider from '../locale-provider';

// Every name below is asserted against the Japanese pack, a locale that is neither the zh_CN default nor English
const ja = ja_JP;
const inJapanese = (ui) => render(<LocaleProvider locale={ja_JP}>{ui}</LocaleProvider>);

describe('可访问名称跟随语言包', () => {
    it('日语语言包中这些断言涉及的名称与英文不同', () => {
        expect(ja.BackTop.backToTop).not.toBe(en_US.BackTop.backToTop);
        expect(ja.TagInput.input).not.toBe(en_US.TagInput.input);
        expect(ja.Pagination.prev).not.toBe(en_US.Pagination.prev);
    });

    describe('BackTop', () => {
        it('为按钮命名，调用方可以覆盖', async () => {
            const { unmount } = inJapanese(<BackTop visibilityHeight={-1} />);
            expect(await screen.findByRole('button', { name: ja.BackTop.backToTop })).toBeInTheDocument();
            unmount();
            inJapanese(<BackTop aria-label="top" visibilityHeight={-1} />);
            expect(await screen.findByRole('button', { name: 'top' })).toBeInTheDocument();
        });
    });

    describe('TagInput', () => {
        it('回退到本地化名称，但调用方已命名输入框时除外', () => {
            const { unmount } = inJapanese(<TagInput defaultValue={['a']} showClear />);
            expect(screen.getByRole('textbox', { name: ja.TagInput.input })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: ja.TagInput.clear })).toBeInTheDocument();
            unmount();
            inJapanese(<TagInput aria-label="mine" />);
            expect(screen.getByRole('textbox', { name: 'mine' })).toBeInTheDocument();
        });

        it('名称交给 aria-labelledby 处理', () => {
            inJapanese(
                <>
                    <span id="lbl">Label</span>
                    <TagInput aria-labelledby="lbl" />
                </>
            );
            expect(screen.getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
        });
    });

    describe('可搜索的多选组件', () => {
        const options = [{ value: 'a', label: 'A' }];
        const treeData = [{ label: 'A', value: 'a', key: 'a' }];

        it('Select 为搜索输入框命名', () => {
            const { unmount } = inJapanese(<Select multiple filter optionList={options} />);
            expect(screen.getByRole('combobox', { name: ja.Select.label }).tagName).toBe('INPUT');
            unmount();
            inJapanese(<Select aria-label="mine" multiple filter optionList={options} />);
            expect(screen.getByRole('combobox', { name: 'mine' }).tagName).toBe('INPUT');
        });

        it('TreeSelect 为搜索输入框命名', () => {
            inJapanese(<TreeSelect multiple filterTreeNode searchPosition="trigger" treeData={treeData} />);
            expect(screen.getByRole('combobox', { name: ja.TreeSelect.label }).tagName).toBe('INPUT');
        });

        it('Cascader 为搜索输入框命名', () => {
            inJapanese(<Cascader multiple filterTreeNode treeData={treeData} />);
            expect(screen.getByRole('combobox', { name: ja.Cascader.label }).tagName).toBe('INPUT');
        });
    });

    it('Pagination 为上一页与下一页按钮命名', () => {
        inJapanese(<Pagination total={50} />);
        expect(screen.getByRole('button', { name: ja.Pagination.prev })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.Pagination.next })).toBeInTheDocument();
    });

    it('Tabs 为可关闭标签的关闭按钮命名', () => {
        inJapanese(
            <Tabs type="card">
                <TabPane closable itemKey="1" tab="one">
                    1
                </TabPane>
            </Tabs>
        );
        expect(screen.getByRole('button', { name: ja.Tabs.close })).toBeInTheDocument();
    });

    it('可折叠 Tabs 为滚动箭头命名', () => {
        Element.prototype.scrollIntoView = vi.fn<() => void>();
        inJapanese(
            <Tabs collapsible>
                <TabPane itemKey="a" tab="a" />
                <TabPane itemKey="b" tab="b" />
            </Tabs>
        );
        expect(screen.getByRole('button', { name: ja.Tabs.prevTabs })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.Tabs.nextTabs })).toBeInTheDocument();
    });

    it('SideSheet 为关闭按钮命名', () => {
        inJapanese(<SideSheet title="t" motion={false} visible />);
        expect(screen.getByRole('button', { name: ja.SideSheet.close })).toBeInTheDocument();
    });

    it('Banner 为类型图标命名', () => {
        inJapanese(<Banner type="warning" description="d" />);
        expect(screen.getByLabelText(ja.Banner.warning)).toBeInTheDocument();
    });

    it('Breadcrumb 为导航命名', () => {
        inJapanese(
            <Breadcrumb>
                <Breadcrumb.Item>a</Breadcrumb.Item>
            </Breadcrumb>
        );
        expect(screen.getByRole('navigation', { name: ja.Breadcrumb.label })).toBeInTheDocument();
    });

    it('Carousel 为箭头命名', () => {
        inJapanese(
            <Carousel arrowType="always">
                <div>1</div>
                <div>2</div>
            </Carousel>
        );
        expect(screen.getByLabelText(ja.Carousel.prev)).toBeInTheDocument();
        expect(screen.getByLabelText(ja.Carousel.next)).toBeInTheDocument();
        expect(screen.getByRole('tablist', { name: ja.Carousel.indicators })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: ja.Carousel.slideN.replace('${index}', '2') })).toBeInTheDocument();
    });

    it('Image 为兜底图片命名', () => {
        const { container } = inJapanese(<Image fallback="fallback.png" src="broken.png" />);
        fireEvent.error(container.querySelector('img'));
        expect(screen.getByAltText(ja.Image.fallback)).toBeInTheDocument();
    });

    it('Input group 有本地化的默认名称', () => {
        inJapanese(
            <InputGroup>
                <Input aria-label="a" />
            </InputGroup>
        );
        expect(screen.getByRole('group', { name: ja.Input.group })).toBeInTheDocument();
    });

    it('Table 为筛选按钮命名', () => {
        inJapanese(<Table columns={[{ title: 'a', dataIndex: 'a', filters: [{ text: 'x', value: 'x' }], onFilter: () => true }]} dataSource={[{ key: '1', a: 'x' }]} />);
        expect(screen.getByRole('button', { name: ja.Table.filterColumn })).toBeInTheDocument();
    });

    it('Table 的筛选按钮在筛选生效时换用生效状态的名称', () => {
        inJapanese(
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
        );
        expect(screen.getByRole('button', { name: ja.Table.filterColumnActive })).toBeInTheDocument();
    });

    it('Tree 为筛选输入框命名', () => {
        inJapanese(<Tree filterTreeNode treeData={[{ label: 'A', value: 'a', key: 'a' }]} />);
        expect(screen.getByRole('textbox', { name: ja.Tree.filter })).toBeInTheDocument();
    });

    it('Transfer 为列表与筛选框命名', () => {
        inJapanese(<Transfer defaultValue={['1']} dataSource={[{ key: '1', label: 'A', value: '1' }]} />);
        expect(screen.getByRole('list', { name: ja.Transfer.optionList })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: ja.Transfer.selectedList })).toBeInTheDocument();
        // dom-testing-library has no implicit role for the native <search> element
        expect(document.querySelector('search')).toHaveAttribute('aria-label', ja.Transfer.filter);
    });

    it('可拖拽的 Transfer 为排序手柄命名并给出角色描述与键盘说明', async () => {
        inJapanese(<Transfer defaultValue={['1']} dataSource={[{ key: '1', label: 'A', value: '1' }]} draggable />);
        // the static stand-in has the same name; the role description comes once the sortable list has loaded
        await vi.waitFor(() => expect(screen.getByRole('button', { name: ja.Transfer.dragSort })).toHaveAttribute('aria-roledescription', ja.Sortable.roleDescription));
        await vi.waitFor(() => expect(screen.getByRole('button', { name: ja.Transfer.dragSort })).toHaveAccessibleDescription(ja.Sortable.instructions));
    });

    it('Upload 为文件列表与图片列表命名', () => {
        const fileList: FileItem[] = [{ uid: '1', name: 'a.txt', status: 'success', size: '1KB', url: 'a.txt' }];
        const { unmount } = inJapanese(<Upload action="/" defaultFileList={fileList} />);
        expect(screen.getByRole('list', { name: ja.Upload.fileList })).toBeInTheDocument();
        unmount();
        inJapanese(<Upload action="/" defaultFileList={fileList} listType="picture" />);
        expect(screen.getByRole('list', { name: ja.Upload.pictureList })).toBeInTheDocument();
    });

    it('Upload 为文件卡片的删除按钮命名', () => {
        const fileList: FileItem[] = [{ uid: '1', name: 'a.txt', status: 'success', size: '1KB', url: 'a.txt' }];
        const { unmount } = inJapanese(<Upload action="/" defaultFileList={fileList} />);
        expect(screen.getByRole('button', { name: ja.Upload.remove })).toBeInTheDocument();
        unmount();
        inJapanese(<Upload action="/" defaultFileList={fileList} listType="picture" />);
        expect(screen.getByRole('button', { name: ja.Upload.remove })).toBeInTheDocument();
    });

    it('Toast 与 Notice 为关闭按钮命名', () => {
        const { unmount } = inJapanese(<Toast id="t" type="info" content="x" duration={0} />);
        expect(screen.getByRole('button', { name: ja.Toast.close })).toBeInTheDocument();
        unmount();
        inJapanese(<NotificationItem title="t" duration={0} />);
        expect(screen.getByRole('button', { name: ja.Notification.close })).toBeInTheDocument();
    });

    it('ColorPicker 为颜色区域与透明度滑块命名', () => {
        inJapanese(
            <ColorPicker
                defaultValue={{
                    hsva: { h: 0, s: 100, v: 100, a: 1 },
                    rgba: { r: 255, g: 0, b: 0, a: 1 },
                    hex: '#ff0000',
                }}
                alpha
            />
        );
        const saturation = screen.getByRole('slider', { name: ja.ColorPicker.saturation });
        expect(saturation).toHaveAttribute('aria-valuetext', ja.ColorPicker.saturationBrightness.replace('${saturation}', '100').replace('${brightness}', '100'));
        expect(screen.getByRole('slider', { name: ja.ColorPicker.brightness })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: ja.ColorPicker.hue })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: ja.ColorPicker.alpha })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: ja.ColorPicker.color })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: ja.ColorPicker.alpha })).toBeInTheDocument();
    });

    it('DatePicker 为触发器命名', () => {
        inJapanese(<DatePicker />);
        expect(screen.getByRole('combobox', { name: ja.DatePicker.chooseDate })).toBeInTheDocument();
    });

    it('Transfer 为已选项的删除按钮命名', () => {
        inJapanese(<Transfer defaultValue={['1']} dataSource={[{ label: 'item1', value: '1', key: '1' }]} />);
        expect(screen.getByRole('button', { name: ja.Transfer.remove })).toBeInTheDocument();
    });

    describe('由模板生成的名称', () => {
        const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replace('${' + key + '}', value), template);

        it('Pagination 为省略号与页码项命名', () => {
            inJapanese(<Pagination defaultCurrentPage={1} showQuickJumper total={200} />);
            expect(screen.getAllByRole('button', { name: ja.Pagination.more }).length).toBeGreaterThan(0);
            expect(screen.getByRole('button', { name: fill(ja.Pagination.pageN, { page: 2 }) })).toBeInTheDocument();
            expect(screen.getByRole('spinbutton', { name: ja.Pagination.jumpTo })).toBeInTheDocument();
        });

        it('Tag 与 TagInput 为可关闭标签命名，调用方可以为 Tag 命名', () => {
            const { unmount } = inJapanese(
                <>
                    <Tag closable>x</Tag>
                    <TagInput defaultValue={['y']} />
                </>
            );
            expect(screen.getByLabelText(fill(ja.Tag.closableTag, { tag: 'x' }))).toBeInTheDocument();
            expect(screen.getByLabelText(fill(ja.Tag.closableTag, { tag: 'y' }))).toBeInTheDocument();
            unmount();
            inJapanese(<Tag aria-label="mine">x</Tag>);
            expect(screen.getByLabelText('mine')).toBeInTheDocument();
        });

        it('Table 为选择复选框与展开按钮命名', () => {
            inJapanese(<Table columns={[{ title: 'a', dataIndex: 'a' }]} dataSource={[{ key: '1', a: 1 }]} rowSelection={{}} expandedRowRender={() => 'more'} />);
            expect(screen.getByRole('checkbox', { name: ja.Table.selectAllRows })).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: ja.Table.selectRow })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: ja.Table.expandRow })).toBeInTheDocument();
        });

        it('Input 为密码显示切换按钮命名', () => {
            inJapanese(<Input mode="password" />);
            expect(screen.getByRole('button', { name: ja.Input.showPassword })).toBeInTheDocument();
        });

        it('Toast 为类型命名', () => {
            inJapanese(<Toast id="t" type="info" content="x" duration={0} />);
            expect(screen.getByRole('status', { name: ja.Toast.info })).toBeInTheDocument();
        });

        it('禁用的 Slider 不用语言包名称覆盖调用方的命名', () => {
            const { unmount } = inJapanese(<Slider disabled />);
            expect(screen.getByRole('slider')).not.toHaveAttribute('aria-label');
            unmount();
            inJapanese(<Slider aria-label="volume" disabled />);
            expect(screen.getByRole('slider', { name: 'volume' })).toBeInTheDocument();
        });

        it('Anchor 为导航命名，除非调用方已命名', () => {
            const { unmount } = inJapanese(<Anchor />);
            expect(screen.getByRole('navigation', { name: ja.Anchor.label })).toBeInTheDocument();
            unmount();
            inJapanese(<Anchor aria-label="toc" />);
            expect(screen.getByRole('navigation', { name: 'toc' })).toBeInTheDocument();
        });

        it('Select 为无标签的 combobox 使用语言包命名', () => {
            inJapanese(<Select defaultValue="a" optionList={[{ value: 'a', label: 'A' }]} />);
            expect(screen.getByRole('combobox', { name: ja.Select.label })).toBeInTheDocument();
        });

        it('AvatarGroup 为 +N 头像命名', () => {
            inJapanese(
                <AvatarGroup maxCount={1}>
                    <Avatar alt="a" />
                    <Avatar alt="b" />
                </AvatarGroup>
            );
            expect(screen.getByRole('img', { name: `${fill(ja.Avatar.more, { count: 1 })}: b` })).toBeInTheDocument();
        });

        it('Rating 为分组与星星命名', () => {
            inJapanese(<Rating defaultValue={2} count={3} />);
            expect(
                screen.getByRole('radiogroup', {
                    name: fill(ja.Rating.label, { value: 2, count: 3, unit: ja.Rating.stars }),
                })
            ).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: fill(ja.Rating.itemLabel, { value: 1, unit: ja.Rating.star }) })).toBeInTheDocument();
        });
    });

    it('AudioPlayer 为播放按钮命名', () => {
        inJapanese(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        expect(screen.getByRole('button', { name: ja.AudioPlayer.play })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.AudioPlayer.volume })).toBeInTheDocument();
    });

    it('Cropper 的裁剪框名称、角色描述与说明来自语言包', () => {
        expect(ja.Cropper.cropArea).not.toBe(en_US.Cropper.cropArea);
        const { container } = inJapanese(<Cropper src="https://example.com/a.png" />);
        const img = container.querySelector('.semi-cropper-img');
        Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        fireEvent.load(img);
        const box = screen.getByRole('group', { name: ja.Cropper.cropArea });
        expect(box).toHaveAttribute('aria-roledescription', ja.Cropper.cropAreaRole);
        expect(box).toHaveAccessibleDescription(ja.Cropper.cropAreaHelp);
    });

    it('VideoPlayer 为纯图标按钮命名', () => {
        inJapanese(<VideoPlayer src="https://example.com/a.mp4" onNext={() => {}} />);
        expect(screen.getByRole('button', { name: ja.VideoPlayer.play })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.VideoPlayer.next })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.VideoPlayer.volume })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.VideoPlayer.fullscreen })).toBeInTheDocument();
    });

    it('AudioPlayer 与 VideoPlayer 的倍速、清晰度、线路按钮名称以日语用途开头', () => {
        expect(ja.VideoPlayer.quality).not.toBe(en_US.VideoPlayer.quality);
        inJapanese(
            <>
                <AudioPlayer audioUrl="https://example.com/a.mp3" />
                <VideoPlayer defaultQuality="1080p" qualityList={[{ label: '1080P', value: '1080p' }]} routeList={[{ label: 'Line 1', value: 'line1' }]} src="https://example.com/a.mp4" />
            </>
        );
        expect(screen.getAllByRole('button', { name: `${ja.AudioPlayer.playbackRate} 1.0x` })).toHaveLength(2);
        expect(ja.VideoPlayer.playbackRate).toBe(ja.AudioPlayer.playbackRate);
        expect(screen.getByRole('button', { name: `${ja.VideoPlayer.quality} 1080P` })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.VideoPlayer.route })).toBeInTheDocument();
    });
});
