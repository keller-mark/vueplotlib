<template>
    <div class="plot-container">
        <slot name="axis-left" :width="width"></slot>
        <slot name="axis-top"></slot>
        <slot name="plot"></slot>
        <slot name="axis-bottom"></slot>
        <slot name="axis-right"></slot>
    </div>
</template>

<script>
export default {
    name: 'PlotContainer',
    props: {
        'width': {
            type: Number
        }
    }
}
</script>

<style>


</style>