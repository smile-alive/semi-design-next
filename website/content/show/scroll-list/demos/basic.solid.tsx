import { createSignal } from 'solid-js';
import { ScrollList, ScrollItem, Button, type ScrollListItem as Item } from '@fibrae/semi-ui-solid';

type Selected = Item & { type?: string | number; index: number };

const minutes = Array.from({ length: 60 }, (_, index) => ({
    value: index,
    disabled: index % 2 === 0,
}));

const ampms = [{ value: '上午' }, { value: '下午' }];
const hours = Array.from({ length: 12 }, (_, index) => ({ value: index + 1 }));

export default function ScrollListDemo() {
    const [selectIndex1, setSelectIndex1] = createSignal(1);
    const [selectIndex2, setSelectIndex2] = createSignal(1);
    const [selectIndex3, setSelectIndex3] = createSignal(1);

    const onSelectAP = (data: Selected) => {
        setSelectIndex1(data.index);
    };

    const onSelectHour = (data: Selected) => {
        console.log('You have choose the hour for: ', data.value);
        setSelectIndex2(data.index);
    };

    const onSelectMinute = (data: Selected) => {
        console.log('You have choose the minute for: ', data.value);
        setSelectIndex3(data.index);
    };

    const handleClose = () => {
        console.log('close');
    };

    const scrollStyle = {
        border: 'unset',
        'box-shadow': 'unset',
    };

    return (
        <ScrollList
            style={scrollStyle}
            header="无限滚动列表"
            footer={
                <Button size="small" type="primary" onClick={handleClose}>
                    Ok
                </Button>
            }
        >
            <ScrollItem aria-label="上午或下午" mode="wheel" cycled={false} list={ampms} type={1} selectedIndex={selectIndex1()} onSelect={onSelectAP} />
            <ScrollItem aria-label="小时" mode="wheel" cycled list={hours} type={2} selectedIndex={selectIndex2()} onSelect={onSelectHour} />
            <ScrollItem aria-label="分钟" mode="wheel" cycled list={minutes} type={3} selectedIndex={selectIndex3()} onSelect={onSelectMinute} />
        </ScrollList>
    );
}
