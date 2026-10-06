# NOTES — `PUT /users/:id`

## The plan

I didn't approve a separate plan-mode plan. Instead, the four requirements
from the README served as the plan, and I gave them to Claude one at a time:
update a user by id, validate the input, return a sensible not-found
response, and go through `db/store.js`. Each step started with Claude
checking what was already in place, then filling the gaps. The files touched
were the ones expected: `db/store.js` for the data helper and
`routes/users.js` for the route. One extra change went into `server.js`
(see the review section).

## Model

Built with Claude Opus 5.5.

## Commits

One logical change per commit, in the order the feature was built:

1. `Add updateUser helper to the in-memory store`: the data layer first, so
   the route has something to call.
2. `Add PUT /users/:id endpoint to update a user`: the route with basic
   validation and a 404. This turned the provided tests green.
3. `Report per-field validation errors on PUT /users/:id`: clearer 400s that
   say which field is missing or invalid, plus an email-format check.
4. `Return 404 for malformed ids on PUT /users/:id`: a bug fix (see below).
5. `Return JSON errors instead of Express's HTML error page`: an app-wide
   error handler (see below).

Keeping the bug fixes separate from the feature means each one can be read,
reverted or cherry-picked on its own.

## What review caught

The provided tests passed after commit 2, but trying unusual inputs turned up
two real problems:

- **Malformed ids updated the wrong user.** The id was read with `Number()`,
  which treats `0x1`, `1e0` and `" 1"` all as `1`, so those requests
  overwrote user 1. Ids now have to be plain positive integers; anything else
  gets a 404.
- **Malformed JSON got an HTML page with a stack trace.** The server didn't
  crash, but Express's default error handler sent HTML that exposed internal
  file paths. A final error handler now returns JSON: 400 for an invalid
  body, the original status for other 4xx errors, and a generic 500 (logged
  on the server) for anything unexpected.

Review confirmed that unknown ids already returned a clean 404, and that the
route only reaches data through `store.updateUser`.

Left out on purpose: `GET /users/:id` still uses `Number()`, so it can read
user 1 through an id like `0x1`. That's a read rather than an overwrite, and
it's outside this change.
