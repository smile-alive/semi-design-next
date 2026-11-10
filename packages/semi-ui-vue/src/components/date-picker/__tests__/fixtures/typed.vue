<script setup lang="ts">
    import { expectTypeOf } from 'vite-plus/test';
    import DatePicker from '../..';
    import { FormDatePicker } from '../../../form';

    const single = (date: Date | undefined, dateString: string | undefined) => [expectTypeOf(date).toEqualTypeOf<Date | undefined>(), expectTypeOf(dateString).toEqualTypeOf<string | undefined>()];
    const many = (date: Date[], dateString: string[]) => [expectTypeOf(date).toEqualTypeOf<Date[]>(), expectTypeOf(dateString).toEqualTypeOf<string[]>()];
</script>

<template>
    <DatePicker @change="(date, dateString) => [expectTypeOf(date).toEqualTypeOf<Date | undefined>(), expectTypeOf(dateString).toEqualTypeOf<string | undefined>()]" />
    <DatePicker type="date" @change="(date, dateString) => [expectTypeOf(date).toEqualTypeOf<Date | undefined>(), expectTypeOf(dateString).toEqualTypeOf<string | undefined>()]" />
    <DatePicker type="dateTime" @change="(date, dateString) => [expectTypeOf(date).toEqualTypeOf<Date | undefined>(), expectTypeOf(dateString).toEqualTypeOf<string | undefined>()]" />
    <DatePicker type="month" @change="(date, dateString) => [expectTypeOf(date).toEqualTypeOf<Date | undefined>(), expectTypeOf(dateString).toEqualTypeOf<string | undefined>()]" />
    <DatePicker type="year" @change="(date, dateString) => [expectTypeOf(date).toEqualTypeOf<Date | undefined>(), expectTypeOf(dateString).toEqualTypeOf<string | undefined>()]" />
    <DatePicker :multiple="false" type="date" @change="(date, dateString) => single(date, dateString)" />
    <DatePicker type="dateRange" @change="(date, dateString) => many(date, dateString)" />
    <DatePicker type="dateTimeRange" @change="(date, dateString) => many(date, dateString)" />
    <DatePicker type="monthRange" @change="(date, dateString) => many(date, dateString)" />
    <DatePicker multiple @change="(date, dateString) => many(date, dateString)" />
    <DatePicker multiple type="date" @change="(date, dateString) => many(date, dateString)" />
    <DatePicker multiple type="year" @change="(date, dateString) => single(date, dateString)" />
    <DatePicker multiple type="dateRange" @change="(date, dateString) => many(date, dateString)" />
    <FormDatePicker field="a" @change="(date, dateString) => single(date, dateString)" />
    <FormDatePicker field="a" type="dateRange" @change="(date, dateString, latest) => [many(date, dateString), expectTypeOf(latest).toEqualTypeOf<Record<string, any>>()]" />
    <FormDatePicker field="a" multiple @change="(date, dateString) => many(date, dateString)" />
</template>
