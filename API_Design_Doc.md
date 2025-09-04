# 📘 API Documentation

**Base URL:**

```
/api
```

**Shared Error Message Structure:**

For simple error message, report:

```json
{
  "error": "Error message here"
}
```

Some API may need to provide error details that cannot be easily covered in an error message. e.g. for batch importing, user may want to know which rows has error. In this case, you may want to define your custom error structure seperately.

---

# 1. Siqi

### Create User

**POST** `/users`

**Payload:**

```
{
    "name": "xxx",
    "uwa_id": "xxx"
}
```

- `200 OK` – User successfully created
- `400 Bad Request` – Invalid input, or user is present

### Create User

**POST** `/users/batch`

payload: a file

**Responses:**

```
{
    error: [
        { row: 0, msg: "xxx" }
    ]
}
```

- `200 OK` – User successfully created. ignore existing users
- `400 Bad Request` – Invalid input

---

### Get Single User

**GET** `/users/{user_id}`

**Responses:**

```

```

- `200 OK` – User details returned
- `404 Not Found` – User does not exist

---

### Edit User Profile

**PATCH** `/users/{user_id}`

**Payload:**

```

```

**Responses:**

- `200 OK` – User profile updated
- `400 Bad Request` – Invalid input
- `404 Not Found` – User not found

---

### Delete User

**DELETE** `/users/{user_id}`

**Responses:**

- `200 OK` – User deleted
- `404 Not Found` – User not found

---

# 2. Gayathri

### List All Users (with pagination & search)

**GET** `/users`

**Query Params:**

- `page` (optional, number)
- `search` (optional, string)

**Responses:**

- `200 OK` – List of users returned

---

### Batch Create Users

**POST** `/users/batch`

**Responses:**

- `200 OK` – Users created
- `400 Bad Request` – Invalid input

---

# 3. Christina

### Create User Group

**POST** `/groups`

**Payload:**

```

```

**Responses:**

- `200 OK` – Group created
- `400 Bad Request` – Invalid input

---

### Update User Group (name)

**PATCH** `/groups/{group_id}`

**Payload:**

```

```

**Responses:**

- `200 OK` – Group updated
- `404 Not Found` – Group not found

---

### Delete User Group

**DELETE** `/groups/{group_id}`

**Responses:**

- `200 OK` – Group deleted
- `404 Not Found` – Group not found

---

### Add Users to Group

**POST** `/groups/{group_id}/users`

**Responses:**

- `200 OK` – Users added to group
- `400 Bad Request` – Invalid input
- `404 Not Found` – Group not found

---

# 4. Dani

### List All User Groups (with pagination & search)

**GET** `/groups`

**Query Params:**

- `page` (optional, number)
- `search` (optional, string)
- `name` (string)
- `search` (string)
- `order_by` (appropriate fields - name/created_by/created_at)
- `order_dir` (asc/desc)

**Responses:**

- `200 OK` – List of groups returned

```json
{
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "total_items": 60,
  "items": [{ "id": "g_1", "name": "Admins", "description": null, "created_at": "...", "updated_at": "..." }]
}
```

---

### Get Single User Group (with members, pagination & search)

**GET** `/groups/{group_id}`

**Query Params:**

- `page` (optional, number)
- `search` (optional, string)
- `search` (string)
- `order_by` (appropriate fields - name/created_by/created_at)
- `order_dir` (asc/desc)

**Responses:**

- `200 OK` – Group details with members returned
- `404 Not Found` – Group not found - Group_id does not exist

```json
{
  "group": { "id": "g_1", "name": "Admins", "description": null, "created_at": "...", "updated_at": "..." },
  "members": {
    "page": 1,
    "page_size": 20,
    "total_pages": 10,
    "total_items": 200,
    "items": [{ "id": "u_10", "email": "a@acme.com", "name": "Alex" }]
  }
}
```

### Trainings - lists all the trainings

**GET** `/trainings`

**Query Params:**

- `page` (optional, number)
- `page_size` (number)
- `name` (string) – filter by training name
- `type` (string) – filter by training type
- `order_by` (name|date|created_at|updated_at)
- `order_dir` (asc|desc)
- `search` (string) – free-text over name/type/description

```json
{
  "page": 1,
  "page_size": 10,
  "total_pages": 5,
  "total_items": 50,
  "items": [
    {
      "id": "t_1",
      "name": "Security 101",
      "type": "video",
      "date": "2025-06-01",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

- `200 OK` – Group details with members returned

### Linking Training and groups

Choose one style from below and stick to that.

**Option A : Links trainings to a group**

**POST** `/groups/{group_id}/trainings`

**Payload**

```json
{ "training_ids": ["t_1", "t_2"] }
```

**Option B: Link groups to a training**

**POST** `/trainings/{training_id}/groups`

**Payload**

```json
{ "group_ids": ["g_1", "g_2"] }
```

**Responses**

- `404 Not Found` – Group or training not found

```json
{ "error": { "code": "not_found", "message": "Group g_404 not found" } }
```

- `200 OK` – Trainings/groups linked

```json
{
  "linked": ["t_1"],
  "already_linked": ["t_2"],
  "not_found": ["t_999"],
  "target_not_found": false
}
```

- `400 Bad Request` – Invalid payload

```json
{ "error": { "code": "bad_request", "message": "training_ids must be a non-empty array of strings" } }
```

**Notes**

- Request is idempotent: repeating the same call won’t duplicate links.
- If some referenced IDs don’t exist, they appear under not_found, but the
  request still returns 200 if the target exists.

### Unlinking Trainings and Groups

**Option A**

**DELETE** `/groups/{group_id}/trainings`

```json
{ "training_ids": ["t_1", "t_2"] }
```

**Option A**

**DELETE** `/trainings/{training_id}/groups`

```json
{ "group_ids": ["g_1", "g_2"] }
```

- `200 OK` – Trainings/groups Unlinked

```json
{
  "unlinked": ["t_1"],
  "not_linked": ["t_2"],
  "not_found": ["t_999"],
  "target_not_found": false
}
```

- `404 Not Found` – target group/training not found
- `400 Bad Request` – invalid payload

**Notes**

- Missing IDs are ignored but shown in not_found.
- Removing a non-existent link is a no-op and reported under not_linked.

---

# 6. Manas

### Show Groups Assigned to a Training

**GET** `/trainings/{training_id}/groups`

**Responses:**

- `200 OK` – Groups linked to training returned
- `404 Not Found` – Training not found

---

### Show Trainings Assigned to a User Group

**GET** `/groups/{group_id}/trainings`

**Responses:**

- `200 OK` – Trainings linked to group returned
- `404 Not Found` – Group not found

---

# 7. Zhaodong

### List All Trainings

**GET** `/trainings`

**Query Params:**

- `page` (optional, number): current page
- `page_size` (optional, number): number of items shown on each page
- `name` (optional, string): filter by training name
- `type` (optional, string): filter by training type
- `order_by` (optional, `name` | `date`)

**Responses:**

- `200 OK` – Trainings returned

```json
{
  "page": 1,
  "total_pages": 5,
  "total_items": 50,
  "trainings": [ ... ]
}
```

---

### Link Trainings to User Groups

#### Option 1:

**POST** `/trainings/{training_id}/groups`

**Payload:**

```json
{ "group_ids": [1, 2] }
```

#### Option 2:

**POST** `/groups/{group_id}/trainings`

**Payload:**

```json
{ "training_ids": [1, 2] }
```

**Responses:**

- `404 Not Found` – Group or training not found
- `200 OK` – Trainings/groups linked
- `400 Bad Request` – Invalid payload

**Notes:**

- If some of the trainings / groups specified in the payload cannot be found by id, they will just be ignored.

---

### Unlink Trainings from User Groups

**DELETE** `/trainings/{training_id}/groups`
**Payload:**

```json
{ "group_ids": [1, 2] }
```

**DELETE** `/groups/{group_id}/trainings`
**Payload:**

```json
{ "training_ids": [1, 2] }
```

**Responses:**

- `404 Not Found` – Group or training not found
- `200 OK` – Trainings/groups unlinked
- `400 Bad Request` – Invalid payload

**Notes:**

- If some of the trainings / groups specified in the payload cannot be found by id, they will just be ignored.
