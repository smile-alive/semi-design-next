import { useState, type CSSProperties } from 'react';
import { IconBulb } from '@fibrae/semi-icons-react';
import { DatePicker, Typography, Tabs, TabPane, Space } from '@fibrae/semi-ui-react';

const { Text } = Typography;

const uedDisabledDate = (currentDate?: Date) => !!currentDate && currentDate.getDate() > 10 && currentDate.getDate() < 15;
const testDisabledDate = (currentDate?: Date) => !!currentDate && currentDate.getDate() > 15 && currentDate.getDate() < 25;

interface SlotProps {
    style?: CSSProperties;
}

interface TopSlotProps extends SlotProps {
    activeKey: string;
    onChange: (activeKey: string) => void;
}

function TopSlot({ style, activeKey, onChange }: TopSlotProps) {
    return (
        <Tabs size="small" onChange={onChange} activeKey={activeKey} style={{ padding: '12px 20px 0', ...style }}>
            <TabPane tab="UED 排期" itemKey="1" />
            <TabPane tab="测试排期" itemKey="2" />
        </Tabs>
    );
}

function BottomSlot({ style }: SlotProps) {
    return (
        <Space style={{ padding: '12px 20px', ...style }}>
            <IconBulb style={{ color: 'var(--semi-amber-5)' }} />
            <Text strong style={{ color: 'var(--semi-color-text-2)' }}>
                定版前请阅读
            </Text>
            <Text link={{ href: 'https://semi.design/', target: '_blank' }}>发版须知</Text>
        </Space>
    );
}

function MonthBottomSlot({ style }: SlotProps) {
    return (
        <Space style={{ padding: '12px 20px', ...style }}>
            <IconBulb style={{ color: 'var(--semi-amber-5)' }} />
            <Text strong style={{ color: 'var(--semi-color-text-2)' }}>
                请阅读
            </Text>
            <Text link={{ href: 'https://semi.design/', target: '_blank' }}>须知</Text>
        </Space>
    );
}

export default function DatePickerDemo() {
    const [activeTab, setActiveTab] = useState('1');
    const [date, setDate] = useState<Date | Date[]>();

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setDate(undefined);
    };

    const handleDateChange = (value: Date | Date[]) => {
        setDate(value);
    };

    const disabledDate = activeTab === '1' ? uedDisabledDate : testDisabledDate;

    return (
        <div>
            <DatePicker topSlot={<TopSlot activeKey={activeTab} onChange={handleTabChange} />} disabledDate={disabledDate} value={date} onChange={handleDateChange} dropdownClassName="components-datepicker-demo-slot" placeholder="请选择排期" />
            <br />
            <br />
            <DatePicker bottomSlot={<BottomSlot />} placeholder="请选择发版时间" />
            <br />
            <br />
            <DatePicker type="month" bottomSlot={<MonthBottomSlot />} placeholder="请选择年月" />
            <br />
            <br />
            <DatePicker topSlot={<TopSlot activeKey={activeTab} onChange={handleTabChange} style={{ padding: '8px 12px 0' }} />} bottomSlot={<BottomSlot style={{ padding: '8px 12px' }} />} density="compact" placeholder="小尺寸" dropdownClassName="components-datepicker-demo-slot" />
            <br />
            <br />
            <DatePicker type="dateTimeRange" bottomSlot={<BottomSlot />} style={{ width: 400 }} placeholder="请选择时间范围" />
            <br />
            <br />
        </div>
    );
}
