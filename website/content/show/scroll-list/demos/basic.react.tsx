import { useState } from 'react';
import { ScrollList, ScrollItem, Button, type ScrollListItem as Item } from '@fibrae/semi-ui-react';

const ampms = [{ value: '上午' }, { value: '下午' }];
const hours = Array.from({ length: 12 }, (_, index) => ({ value: index + 1 }));
const minutes = Array.from({ length: 60 }, (_, index) => ({ value: index, disabled: index % 3 === 0 }));

const scrollStyle = {
    border: 'unset',
    boxShadow: 'unset',
};

export default function ScrollListDemo() {
    const [selectIndex1, setSelectIndex1] = useState(1);
    const [selectIndex2, setSelectIndex2] = useState(1);
    const [selectIndex3, setSelectIndex3] = useState(1);

    const onSelectAP = (data: Item) => {
        setSelectIndex1(data.index);
    };

    const onSelectHour = (data: Item) => {
        console.log('You have choose the hour for: ', data.value);
        setSelectIndex2(data.index);
    };

    const onSelectMinute = (data: Item) => {
        console.log('You have choose the minute for: ', data.value);
        setSelectIndex3(data.index);
    };

    const handleClose = () => {
        console.log('close');
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
            <ScrollItem aria-label="上午或下午" mode="wheel" cycled={false} list={ampms} type={1} selectedIndex={selectIndex1} onSelect={onSelectAP} />
            <ScrollItem aria-label="小时" mode="wheel" cycled list={hours} type={2} selectedIndex={selectIndex2} onSelect={onSelectHour} />
            <ScrollItem aria-label="分钟" mode="wheel" cycled list={minutes} type={3} selectedIndex={selectIndex3} onSelect={onSelectMinute} />
        </ScrollList>
    );
}
