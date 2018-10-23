<template>
  <div>
      <button @click="stack.goBack()" :disabled="!stack.canGoBack()" class="stack-button">Back</button>
      <button @click="stack.goForward()" :disabled="!stack.canGoForward()" class="stack-button">Forward</button>
      <div class="stack-elements">
        <div v-for="(el, index) in elementsReversed" :key="index">
            <span v-if="isCurrent(index)" class="pointer">&gt;</span>
            {{ el.toJson() }}
        </div>
      </div>
  </div>
</template>

<script>

export default {
  name: 'Stack',
  props: ['getStack'],
  data() {
      return {
          elements: this.getStack()._stack,
          stack: this.getStack()
      }
  },
  computed: {
      elementsReversed() {
          return this.elements.slice().reverse();
      }
  },
  methods: {
      isCurrent(index) {
          return (this.stack._pointer == (this.elements.length - 1 - index));
      }
  }
}
</script>

<style>
.stack-button {
    z-index: 5;
}
.pointer {
    color: red;
}
.stack-elements {
    position: absolute;
    bottom: 0;
    width: 400px;
}
</style>
