class StepExecution {
  constructor(options) {
    this.createdAt = new Date(options.createdAt);
    this.id = options.id;
    this.step = options.step;
  }
}

export default StepExecution;