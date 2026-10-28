<script setup lang="ts">
    import Numeral from '../../numeral.vue';
</script>

<!-- Past the compiler's stringify threshold; cached slot vnodes must not be changed in place -->
<template>
    <Numeral :precision="1"> <i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i><i>1.55</i> </Numeral>
</template>
