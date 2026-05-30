# Beginner-Friendly Express + MongoDB Demo

This project is a small college-style backend example that shows how to build an API with:

- Node.js
- Express
- MongoDB
- Mongoose
- bcryptjs for password hashing

## What It Does

The app uses a simple `Author` model and demonstrates full CRUD operations:

- `GET /` - home message
- `GET /api/authors` - read all authors
- `GET /api/authors/:id` - read one author
- `POST /api/authors` - create a new author
- `PUT /api/authors/:id` - update an author
- `DELETE /api/authors/:id` - delete an author

## Folder Structure

- `Models` - Mongoose schemas
- `Controllers` - request logic
- `Routes` - API endpoints
- `config` - database connection
- `middleware` - shared error handler

## Setup

1. Install Node.js if it is not already installed.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `.env` if you want to use environment variables.
4. Start MongoDB locally or update `MONGODB_URI`.
5. Run the project with `npm run dev`.

## Example Request Body

```json
{
  "name": "John Smith",
  "password": "secret123"
}
```

## Notes

- The code is intentionally simple and beginner-friendly.
- Passwords are hashed with `bcryptjs` before saving.
- Responses use common HTTP status codes such as `200`, `201`, `400`, `404`, and `500`.