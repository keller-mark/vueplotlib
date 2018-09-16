<template>
  <div>
    <p>Stacked Bar Plot Here {{ message }} {{ size }}</p>
  </div>
</template>

<script>
  var isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }
  export default {
    props: {
      'size': {
        type: Number,
        default: 3
      },
      'message': {
        type: String,
        default: ''
      }
    },
    computed: {
      
    }
  }
</script>

<style>
  
</style>