# PromptFence API Reference (v1)

Base URL: `/api/v1`

All authenticated endpoints require an `access_token` cookie or `Authorization: Bearer <token>` header.

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user account | 201 Created |
| `POST` | `/auth/verify-email` | Verify email address with token | 200 OK |
| `POST` | `/auth/login` | Authenticate with email and password | 200 OK |
| `POST` | `/auth/refresh` | Rotate refresh token and issue new token pair | 200 OK |
| `POST` | `/auth/logout` | Revoke current refresh token and clear cookies | 200 OK |
| `POST` | `/auth/logout-all` | Revoke all active sessions across all devices | 200 OK |
| `POST` | `/auth/forgot-password` | Request password reset email | 200 OK |
| `POST` | `/auth/reset-password` | Reset password using valid reset token | 200 OK |
| `GET` | `/auth/me` | Retrieve currently authenticated user context | 200 OK |

## 2. Users (`/api/v1/users`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/users/me` | Get profile details and assigned roles | 200 OK |
| `PATCH` | `/users/me` | Update name and avatar URL | 200 OK |
| `POST` | `/users/me/change-password` | Change password and revoke prior sessions | 200 OK |
| `GET` | `/users/me/sessions` | List active browser device sessions | 200 OK |
| `DELETE` | `/users/me/sessions/{id}` | Revoke a specific active session | 200 OK |

## 3. Targets (`/api/v1/targets`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/targets` | List targets with pagination (`page`, `page_size`) | 200 OK |
| `POST` | `/targets` | Create target and record initial v1 snapshot | 201 Created |
| `GET` | `/targets/{id}` | Retrieve target configuration by ID | 200 OK |
| `PATCH` | `/targets/{id}` | Update configuration & increment version | 200 OK |
| `DELETE` | `/targets/{id}` | Delete target and its version history | 200 OK |
| `POST` | `/targets/{id}/validate` | Safe SSRF-protected connectivity test | 200 OK |
| `GET` | `/targets/{id}/versions` | List historical configuration version snapshots | 200 OK |
| `PATCH` | `/targets/{id}/status` | Enable or disable target | 200 OK |

## 4. Test Suites (`/api/v1/test-suites`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/test-suites` | List test suites with scenario counts | 200 OK |
| `POST` | `/test-suites` | Create a new test suite | 201 Created |
| `GET` | `/test-suites/{id}` | Retrieve suite details by ID | 200 OK |
| `PATCH` | `/test-suites/{id}` | Update suite name/description | 200 OK |
| `DELETE` | `/test-suites/{id}` | Delete test suite | 200 OK |
| `POST` | `/test-suites/{id}/scenarios` | Attach a scenario to this suite | 201 Created |
| `DELETE` | `/test-suites/{id}/scenarios/{scenario_id}` | Remove a scenario from this suite | 200 OK |
| `PATCH` | `/test-suites/{id}/scenarios/order` | Reorder scenarios execution order | 200 OK |

## 5. Scenarios (`/api/v1/scenarios`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/scenarios` | List scenarios (filters: `category`, `severity`) | 200 OK |
| `POST` | `/scenarios` | Author a new attack scenario | 201 Created |
| `GET` | `/scenarios/{id}` | Retrieve scenario by ID | 200 OK |
| `PATCH` | `/scenarios/{id}` | Update attack prompt or assertions | 200 OK |
| `DELETE` | `/scenarios/{id}` | Delete scenario | 200 OK |
| `PATCH` | `/scenarios/{id}/status` | Enable / disable scenario | 200 OK |

## 6. Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/dashboard/overview` | Platform-wide totals and recent records | 200 OK |
| `GET` | `/dashboard/activity` | Chronological activity feed | 200 OK |
| `GET` | `/dashboard/distributions` | Category, severity, and type distributions | 200 OK |

