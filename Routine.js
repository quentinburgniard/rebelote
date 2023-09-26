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

  constructor(options) {
    this.storage = options.storage;
    this.token = options.token;
  }

  async get(id) {
    switch (this.storage) {
      case 'strapi':
        return await this.getFromStrapi(id);
    }
  }

  async getFromStrapi(id) {
    const response = await axios.get(`https://api.digitalleman.com/v2/routines/${id}?populate[0]=executions&populate[1]=executions.stepExecutions&populate[2]=executions.stepExecutions.step&populate[3]=steps`, {
      headers: {
        'authorization': `Bearer ${this.token}`
      }
    });
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
          id: stepExecution.id,
          step: step
        }));
        //console.log(response.data.data.attributes.executions.data[0])
        //const execution = response.data.data.attributes.executions.data.find((execution) => element > step.id);
      });
      this.executions.push(new Execution({
        createdAt: execution.attributes.createdAt,
        id: execution.id,
        steps: stepExecutions
      }));
    });
    /*((execution) => new Execution({
    this.executions = 
      createdAt: execution.attributes.createdAt,
      id: execution.id,
      steps: execution.attributes.stepExecutions.data.map((stepExecution) => new StepExecution({
        id: stepExecution.id
      }))
    }));*/
    return true;
  }

  get completedExecutions() {
    return this.executions.filter((execution) => execution.steps.length == this.steps.length);
  }

  get uncompletedExecutions() {
    return this.executions.filter((execution) => execution.steps.length < this.steps.length);
  }
}

export default Routine;