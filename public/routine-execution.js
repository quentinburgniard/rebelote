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
            execution: executionID,
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
      step: null,
      steps: steps
    }
  },
  methods: {
    nextStep() {
      fetch(`https://api.digitalleman.com/v2/routine-executions/${executionID}?populate[0]=stepExecutions&populate[1]=stepExecutions.step`, {
        headers: {
          'authorization': `Bearer ${ID.getToken()}`,
          'content-type': 'application/json'
        }
      }).then((response) => response.json()).then((response) => {
        response.data.attributes.stepExecutions.data.forEach((stepExecution) => {
          let step = this.steps.find((step) => step.id == stepExecution.attributes.step.data.id);
          if (step) step.execution = stepExecution;
        });
        if (this.currentStep) {
          window.location.hash = `#${this.currentStep.id}`;
        } else {
          window.location.replace(`https://rebelote.digitalleman.com/fr/${routineID}`);
        }
      }).catch(error => {
        console.log(error);
      });
    },
    getStep() {
      let hash = window.location.hash.slice(1);
      let index = this.steps.findIndex((step) => step.id == hash);
      let step = null;
      if (index != -1) {
        step = this.steps.find((step, stepIndex) => !step.execution || stepIndex == index).id;
      } else if (this.currentStep) {
        step = this.currentStep.id;
      }
      if (step) {
        if (window.location.hash != `#${step}`) window.location.hash = `#${step}`;
      } else {
        window.location.replace(`https://rebelote.digitalleman.com/fr/${routineID}`);
      }
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