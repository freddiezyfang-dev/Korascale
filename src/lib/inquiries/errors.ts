export class InquiryValidationError extends Error {
  errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super('Inquiry validation failed');
    this.name = 'InquiryValidationError';
    this.errors = errors;
  }
}

export class InquiryPersistenceError extends Error {
  constructor(message = 'Failed to persist inquiry') {
    super(message);
    this.name = 'InquiryPersistenceError';
  }
}
