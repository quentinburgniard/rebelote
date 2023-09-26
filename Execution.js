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
}

export default Execution;