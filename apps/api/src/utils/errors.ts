export class ServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function notFound(message: string, code = "not_found") {
  return new ServiceError(message, 404, code);
}

export function invalidRequest(message: string, code = "invalid_request") {
  return new ServiceError(message, 422, code);
}

export function conflict(message: string, code = "conflict") {
  return new ServiceError(message, 409, code);
}

export function serviceUnavailable(message: string, code = "service_unavailable") {
  return new ServiceError(message, 503, code);
}
