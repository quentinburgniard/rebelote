import axios from 'axios';
import Execution from './Execution.js';
import Step from './Step.js';
import StepExecution from './StepExecution.js';

class Routine {
  executions = [];
  id;
  locale;
  steps = [];
  title;
  #token;

  constructor(options) {
    this.storage = options.storage;
    this.#token = options.token;
  }

  async get(id) {
    switch (this.storage) {
      case 'strapi':
        return this.getFromStrapi(id);
    }
  }

  async getFromStrapi(id) {
    return axios.get(`https://api.digitalleman.com/v2/routines/${id}?populate[0]=executions&populate[1]=executions.stepExecutions&populate[2]=executions.stepExecutions.step&populate[3]=steps`, {
      headers: {
        'authorization': `Bearer ${this.#token}`
      }
    }).then((response) => {
      this.id = response.data.data.id;
      this.locale = response.data.data.attributes.locale;
      this.title = response.data.data.attributes.title;
      this.steps = response.data.data.attributes.steps.data.map((step) => new Step({
        description: step.attributes.description,
        locale: step.attributes.locale,
        id: step.id,
        inputType: step.attributes.inputType,
        title: step.attributes.title
      }));
      response.data.data.attributes.executions.data.forEach((execution) => {
        let stepExecutions = [];
        this.steps.forEach((step) => {
          const stepExecution = execution.attributes.stepExecutions.data.find((execution) => execution.attributes.step.data.id == step.id);
          if (stepExecution) stepExecutions.push(new StepExecution({
            createdAt: stepExecution.attributes.createdAt,
            id: stepExecution.id,
            step: step
          }));
        });
        this.executions.push(new Execution({
          createdAt: execution.attributes.createdAt,
          id: execution.id,
          steps: stepExecutions
        }));
      });
      return response.status;
    }).catch((error) => {
      return error.response && error.response.status || 500;
    });
  }

  get completedExecutions() {
    let completedExecutions = [];
    if (this.steps.length) {
      completedExecutions = this.executions.filter((execution) => execution.steps.length == this.steps.length);
    }
    return completedExecutions;
  }

  get uncompletedExecutions() {
    return this.executions.filter((execution) => execution.steps.length < this.steps.length);
  }
}

export default Routine;