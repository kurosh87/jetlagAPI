// Custom error class for jetlag service validation errors
export class JetlagValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JetlagValidationError';
    Object.setPrototypeOf(this, JetlagValidationError.prototype);
  }
} 