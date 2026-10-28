<script setup lang="ts">
    import Numeral from '../../numeral.vue';

    defineProps<{ parser?: (value: string) => string }>();
</script>

<template>
    <Numeral :precision="2" rule="numbers" truncate="ceil">
        <div class="price">
            <span>预期价格:{{ 1.555 }}; 成本: -1; 盈利: 0.555</span>
            <b>Currency symbols: $</b>
        </div>
    </Numeral>
    <Numeral :parser="parser" :precision="2" rule="exponential" truncate="floor">
        <div class="total">Total revenue: <b>$ 1992.15</b></div>
    </Numeral>
</template>
