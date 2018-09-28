<template>
  <div>
      <div v-for="(el, index) in elementsReversed" :key="index">
          {{ el.toJson() }}
      </div>
  </div>
</template>

<script>

export default {
  name: 'Stack',
  props: ['getStack'],
  data() {
      return {
          elements: this.getStack()._stack
      }
  },
  computed: {
      elementsReversed() {
          return this.elements.reverse();
      }
  }
}
</script>

<style>

</style>
