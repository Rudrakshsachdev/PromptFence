"""Custom exception classes for the application."""


class AppError(Exception):
    """Base application error."""

    def __init__(self, message: str = "An unexpected error occurred", status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(AppError):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=404)


class ConflictError(AppError):
    """Resource conflict (e.g. duplicate)."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message=message, status_code=409)


class AuthenticationError(AppError):
    """Authentication failure."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message=message, status_code=401)


class AuthorizationError(AppError):
    """Authorization / permission failure."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message=message, status_code=403)


class ValidationError(AppError):
    """Input validation error."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(message=message, status_code=422)


class RateLimitError(AppError):
    """Rate limit exceeded."""

    def __init__(self, message: str = "Rate limit exceeded. Try again later."):
        super().__init__(message=message, status_code=429)


class SSRFError(AppError):
    """Server-Side Request Forgery attempt detected."""

    def __init__(self, message: str = "Request to the specified URL is not allowed"):
        super().__init__(message=message, status_code=400)
