<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { IconBulb } from '@fibrae/semi-icons-vue';
    import { DatePicker, Space, TabPane, Tabs, Typography, type DatePickerValueType } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;

    const uedDisabledDate = (currentDate?: Date) => !!currentDate && currentDate.getDate() > 10 && currentDate.getDate() < 15;
    const testDisabledDate = (currentDate?: Date) => !!currentDate && currentDate.getDate() > 15 && currentDate.getDate() < 25;

    const activeTab = ref('1');
    const date = ref<DatePickerValueType>();
    const disabledDate = computed(() => (activeTab.value === '1' ? uedDisabledDate : testDisabledDate));
</script>

<template>
    <div>
        <DatePicker v-model="date" :disabledDate="disabledDate" dropdownClassName="components-datepicker-demo-slot" placeholder="请选择排期">
            <template #topSlot>
                <Tabs v-model:activeKey="activeTab" size="small" :style="{ padding: '12px 20px 0' }" @change="date = undefined">
                    <TabPane itemKey="1">
                        <template #tab>UED 排期</template>
                    </TabPane>
                    <TabPane itemKey="2">
                        <template #tab>测试排期</template>
                    </TabPane>
                </Tabs>
            </template>
        </DatePicker>
        <br />
        <br />
        <DatePicker placeholder="请选择发版时间">
            <template #bottomSlot>
                <Space :style="{ padding: '12px 20px' }">
                    <IconBulb :style="{ color: 'var(--semi-amber-5)' }" />
                    <Text strong :style="{ color: 'var(--semi-color-text-2)' }">定版前请阅读</Text>
                    <Text :link="{ href: 'https://semi.design/', target: '_blank' }">发版须知</Text>
                </Space>
            </template>
        </DatePicker>
        <br />
        <br />
        <DatePicker placeholder="请选择年月" type="month">
            <template #bottomSlot>
                <Space :style="{ padding: '12px 20px' }">
                    <IconBulb :style="{ color: 'var(--semi-amber-5)' }" />
                    <Text strong :style="{ color: 'var(--semi-color-text-2)' }">请阅读</Text>
                    <Text :link="{ href: 'https://semi.design/', target: '_blank' }">须知</Text>
                </Space>
            </template>
        </DatePicker>
        <br />
        <br />
        <DatePicker density="compact" dropdownClassName="components-datepicker-demo-slot" placeholder="小尺寸">
            <template #topSlot>
                <Tabs v-model:activeKey="activeTab" size="small" :style="{ padding: '8px 12px 0' }" @change="date = undefined">
                    <TabPane itemKey="1">
                        <template #tab>UED 排期</template>
                    </TabPane>
                    <TabPane itemKey="2">
                        <template #tab>测试排期</template>
                    </TabPane>
                </Tabs>
            </template>
            <template #bottomSlot>
                <Space :style="{ padding: '8px 12px' }">
                    <IconBulb :style="{ color: 'var(--semi-amber-5)' }" />
                    <Text strong :style="{ color: 'var(--semi-color-text-2)' }">定版前请阅读</Text>
                    <Text :link="{ href: 'https://semi.design/', target: '_blank' }">发版须知</Text>
                </Space>
            </template>
        </DatePicker>
        <br />
        <br />
        <DatePicker placeholder="请选择时间范围" :style="{ width: '400px' }" type="dateTimeRange">
            <template #bottomSlot>
                <Space :style="{ padding: '12px 20px' }">
                    <IconBulb :style="{ color: 'var(--semi-amber-5)' }" />
                    <Text strong :style="{ color: 'var(--semi-color-text-2)' }">定版前请阅读</Text>
                    <Text :link="{ href: 'https://semi.design/', target: '_blank' }">发版须知</Text>
                </Space>
            </template>
        </DatePicker>
        <br />
        <br />
    </div>
</template>
