class Execution {
  createdAt;
  steps = [];

  constructor(options) {
    this.createdAt = new Date(options.createdAt);
    this.id = options.id;
    this.steps = options.steps;
  }

  formattedCreatedAt(language) {
    return `${this.createdAt.toLocaleDateString(language, { weekday: 'long' })} ${this.createdAt.toLocaleDateString(language, { day: 'numeric' })} ${this.createdAt.toLocaleDateString(language, { year: 'numeric' })}`
  }

  get minutesElapsed() {
    return this.#millisecondsElapsed / 60000;
  }

  get #millisecondsElapsed() {
    return this.#lastStep.createdAt - this.#firstStep.createdAt;
  }

  get #firstStep() {
    return this.steps.reduce((firstStep, step) => firstStep.createdAt < step.createdAt ? firstStep : step);
  }

  get #lastStep() {
    return this.steps.reduce((lastStep, step) => lastStep.createdAt > step.createdAt ? lastStep : step);
  }
}

export default Execution;