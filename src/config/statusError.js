module.exports = class StatusError extends Error {
  static badRequest(message) {
    return new StatusError(400, message || "badRequest");
  }
  static notFound(message) {
    return new StatusError(404, message || "notFound");
  }
  static conflict(message) {
    return new StatusError(409, message || "conflict");
  }
  static serverError(message) {
    return new StatusError(500, message || "serverError");
  }
  statusCode;
  constructor(code, message) {
    super(message);
    this.statusCode = code;
  }
};
