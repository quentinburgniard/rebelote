import { createApp, defineComponent, ref } from 'vue';

const Step = {
  props: ['description', 'id', 'title'],
  template: '#step'
};

const app = createApp({
  computed: {
    currentStep() {
      return routes[this.currentPath.slice(1)]
    }
  },
  data() {
    return {
      currentPath: window.location.hash,
      message: 'Hello Vue!'
    }
  }
});

app.component('Step', Step);

app.mount('#app');