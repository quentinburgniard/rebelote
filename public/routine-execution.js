import { createApp } from 'vue';

const Step = {
  data() {
    return {
      value: this.step.execution && this.step.execution.attributes.value || ''
    }
  },
  methods: {
    nextStep(event) {
      event.target.disabled = true;
      fetch('https://api.digitalleman.com/v2/routine-step-executions', {
        method: 'post',
        body: JSON.stringify({
          data: {
            execution: this.$root.id,
            step: this.step.id,
            value: this.value,
          }
        }),
        headers: {
          'authorization': `Bearer ${ID.getToken()}`,
          'content-type': 'application/json'
        }
      }).then(response => {
        if (response.ok) this.$emit('nextStep');
      }).catch(error => {
        console.log(error);
      });
    }
  },
  props: ['step'],
  template: '#step'
};

const app = createApp({
  computed: {
    currentStep() {
      return this.steps.find((step) => !step.execution);
    }
  },
  data() {
    return {
      id: id,
      step: 0,
      steps: steps
    }
  },
  methods: {
    nextStep() {
      if (window.location.hash == '#0') {
        window.location.hash = `#${this.currentStep ? this.currentStep.id : 0}`;
      } else {
        fetch(`https://api.digitalleman.com/v2/routine-executions/${this.id}?populate[0]=stepExecutions&populate[1]=stepExecutions.step`, {
          headers: {
            'authorization': `Bearer ${ID.getToken()}`,
            'content-type': 'application/json'
          }
        }).then((response) => response.json()).then((response) => {
          response.data.attributes.stepExecutions.data.forEach((stepExecution) => {
            let step = this.steps.find((step) => step.id == stepExecution.attributes.step.data.id);
            if (step) step.execution = stepExecution;
          });
          window.location.hash = `#${this.currentStep ? this.currentStep.id : 0}`;
        }).catch(error => {
          console.log(error);
        }); 
      }
    },
    getStep() {
      let hash = window.location.hash.slice(1);
      let index = this.steps.findIndex((step) => step.id == hash);
      let step = 0;
      if (index != -1) step = this.steps.find((step, stepIndex) => !step.execution || stepIndex == index).id;
      if (window.location.hash != `#${step}`) window.location.hash = `#${step}`;
      return step;
    }
  },
  mounted() {
    this.step = this.getStep();
    window.addEventListener('hashchange', () => this.step = this.getStep())
  }
});

app.component('Step', Step);

app.mount('#app');