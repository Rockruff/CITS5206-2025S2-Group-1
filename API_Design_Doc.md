# 📘 API Documentation

**Base URL:**

```
/api
```

---

## HTTP Status Codes

| Code | Meaning                                             |
| ---- | --------------------------------------------------- |
| 200  | Success                                             |
| 400  | Bad Request — include an error message              |
| 404  | Not Found — only when the URL entity does not exist |

**Example:** Accessing `/users/12345678` when user `12345678` does not exist returns `404`, not `400`.

---

## Error Handling

**Single error:**

When error occurs, all API should return error in a consistent format.

```json
{
  "error": "Invalid UWA ID"
}
```

**Batch or complex errors:**

Currently, only `/users/batch` need this format.

```json
{
  "errors": [
    { "row": 0, "msg": "Invalid UWA ID" },
    { "row": 3, "msg": "Name mismatch" }
  ]
}
```

---

# 1. Users

### Create User

**POST** `/users`

```json
{
  "id": "12345678",
  "name": "Alice Johnson"
}
```

- Should also save initial alias.
- If UWA ID exists → error.

**Response:** Same as `GET /users/{user_id}`.

---

### Get Single User

**GET** `/users/{user_id}`

```json
{
  "id": "12345678",
  "name": "Alice Johnson",
  "role": "VIEWER",
  "aliases": ["12345678", "87654321"],
  "groups": ["a1b2c3d4-e5f6-7a8b-9c0d-123456abcdef"]
}
```

---

### List Users

**GET** `/users`

**Query Parameters:**

- `page` (default: 1)
- `page_size` (default: 10)
- `order_by=id|name|role` (prefix `-` for descending)
- `group` (filter by group ID)
- `name` (keyword search)
- `role` (filter by role)

**Response:**

```json
{
  "page": 1,
  "page_size": 2,
  "total_pages": 3,
  "total_items": 5,
  "items": [
    // Same format as GET /users/{user_id}
  ]
}
```

---

### Edit User Profile

**PATCH** `/users/{user_id}`

```json
{
  "id": "12345678",
  "name": "Alice J.",
  "role": "ADMIN"
}
```

- ID must be one of the user's aliases; this means updating primary UWA ID.

---

### Manage Aliases

**Add alias:**
**POST** `/users/{user_id}/aliases`

```json
{ "id": "87654321" }
```

**Remove alias:**
**DELETE** `/users/{user_id}/aliases`

```json
{ "id": "87654321" }
```

- Primary UWA ID cannot be removed.

---

### Delete User

**DELETE** `/users/{user_id}`

---

### Batch Create Users

**POST** `/users/batch`

**Request:** File upload with `Name` and `UWA ID`.

**Rules:**

- Ignore irrelevant columns.
- Only create new users from `id` and `name`.
- If ID exists and name mismatches → error.

**Error format:**

```json
{
  "errors": [{ "row": 1, "msg": "Name mismatch for UWA ID 87654321" }]
}
```

---

# 2. Groups

### Create Group

**POST** `/groups`

```json
{
  "name": "Lab Safety Training Participants",
  "description": "Group of users required to complete Lab Safety Training"
}
```

**Response:** Same as `GET /groups/{group_id}`.

---

### Get Single Group

**GET** `/groups/{group_id}`

```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-123456abcdef",
  "timestamp": "2025-08-01T10:15:30Z",
  "name": "Lab Safety Training Participants",
  "description": "Group of users required to complete Lab Safety Training"
}
```

---

### List All Groups

**GET** `/groups`
**Response:**

```json
[
  // Same format as GET /groups/{group_id}
]
```

---

### Update Group

**PATCH** `/groups/{group_id}`

```json
{
  "name": "Updated Lab Safety Training Participants",
  "description": "Updated description"
}
```

---

### Delete Group

**DELETE** `/groups/{group_id}`

---

### Add Users to Group

**POST** `/groups/{group_id}/users`

**Request:**

```json
{ "id": "12345678" }
```

- Optional: accept a list for all-or-nothing transaction:

```json
[{ "id": "12345678" }, { "id": "87654321" }]
```

---

### Show Trainings Assigned to a Group

**GET** `/groups/{group_id}/trainings`

**Response:**

```json
[
  // Same format as GET /trainings/{training_id}
]
```

---

# 3. Trainings

### Create Training

**POST** `/trainings`

**Payloads by type:**

**LMS:**

```json
{
  "name": "Lab Safety Training",
  "description": "Mandatory lab safety procedures",
  "expiry": 365,
  "type": "LMS",
  "config": { "completance_score": 80 }
}
```

**TryBooking:**

```json
{
  "name": "Orientation Session",
  "description": "Initial onboarding session",
  "expiry": 0,
  "type": "TRYBOOKING",
  "config": {}
}
```

**External:**

```json
{
  "name": "Ethics Workshop",
  "description": "External workshop on research ethics",
  "expiry": 0,
  "type": "EXTERNAL",
  "config": {
    "proof_fields": [
      /* To be decided later, can skip */
    ]
  }
}
```

**Response:** Same as `GET /trainings/{training_id}`.

---

### Get Training

**GET** `/trainings/{training_id}`

```json
{
  "id": "f9b8c3d1-1234-4abc-8def-9876543210ab",
  "timestamp": "2025-09-01T08:00:00Z",
  "name": "Lab Safety Training",
  "description": "Mandatory lab safety procedures",
  "expiry": 365,
  "type": "LMS",
  "config": { "completance_score": 80 }
}
```

---

### List Trainings

**GET** `/trainings`
**Response:**

```json
[
  // Same format as GET /trainings/{training_id}
]
```

---

### Edit Training

**PATCH** `/trainings/{training_id}`

```json
{
  "name": "Updated Lab Safety Training",
  "description": "Updated description",
  "expiry": 400,
  "config": { "completance_score": 85 }
}
```

---

### Delete Training

**DELETE** `/trainings/{training_id}`

---

### Link/Unlink Training to Group

**POST** `/trainings/{training_id}/groups`
**DELETE** `/trainings/{training_id}/groups`

**Request:**

```json
{ "id": "a1b2c3d4-e5f6-7a8b-9c0d-123456abcdef" }
```

- Optional: accept a list for all-or-nothing transaction:

```json
[{ "id": "a1b2c3d4-e5f6-7a8b-9c0d-123456abcdef" }, { "id": "e4da3b7f-bbce-4fcd-9a77-abcdef123456" }]
```

---

### Show Groups Assigned to a Training

**GET** `/trainings/{training_id}/groups`
**Response:**

```json
[
  // Same format as GET /groups/{group_id}
]
```
