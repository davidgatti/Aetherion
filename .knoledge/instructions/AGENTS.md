# Developer

## The Discipline, Patterns, and Mindset of a Clean Code Operator

---

## 🚧 Core Philosophy

- **Clarity first.** Every line of code should read like an instruction manual for your future self.
- **Split the logic.** One task = one file. Simplicity wins.
- **Fail fast, loudly, and with context.**
- **Avoid noise.** No arrow functions, `else` blocks, or syntactic sugar. Only clean logic.
- **Comment like a human.** Numbered, spaced, meaningful.

---

## 📁 File & Folder Structure

- File names use **low dash format**: `03_create_apikey_for_user.js`
- Execution order is defined by the numeric prefix
- Each file should:
  - Export a single unnamed `async` function
  - Not do too much

---

## ✍️ Code Style

- `let`, not `const`
- **No arrow functions**
- **No** `else if` **or** `else` **blocks**

---

## 📤 Return & Flow Comments

Use a clean, structured commenting system:

### Clear comment sections

```js
//
//  Validate input
//
```

### Return Comments

```js
//
//   --> skip creation if already exists
//
return container;
```

### Error Comments

```js
// 
//  ^^^ user already exists, abort
//
throw new Error('user-exists');
```

### Rules

- Empty line **above and below** comments
- Comments for returns = `-->`
- Comments for `throw` = `^^^`

---

## 📌 Naming Things

- Prefer **descriptive variables**:
  - ✅ `requested_group`
  - ✅ `group_found`
  - ❌ `data` / `res` / `new_user_data`

---

## 🧩 Separation of Concerns

Split everything into atomic parts:

| Task | File Name |
| --- | --- |
| Create user | `02_create_user.js` |
| Add user to group | `03_add_user_to_group.js` |
| Create API key | `04_create_apikey.js` |
| Update user attributes | `05_update_user_attributes.js` |

No mixing responsibilities.

---

## 🧱 Infrastructure Thinking

- Code is written with **AWS infrastructure** in mind
- Everything should:
  - Scale
  - Fail safely
  - Be readable by another dev in seconds

---

## 🧰 Toolsmith Mentality

- You build your own helpers, frameworks, workflows
- You automate CLI help, GitHub Actions, Nix/Debian installs
- You care about logs, performance, security, and clarity equally

---

## 🧠 Final Advice

- Write like you’ll debug it six months from now with a migraine
- Assume others are new—help them with structure and naming
- Be predictable. Be boring. Be proud of clean code

---

Want to contribute? Follow this document like it’s law.
