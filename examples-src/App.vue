<template>
  <div id="app">
    <StackedBarPlot size="1" :message="message" />   
  </div>
</template>

<script>
  import StackedBarPlot from '../src/components/StackedBarPlot.vue'

  export default {
    name: 'app',
    components: {
      StackedBarPlot
    },
    data() {
      return {
        message: 'Test Message'
      }
    },
    computed: {

    },
    mounted() {
      
    }
  }
</script>

<style>

</style>
