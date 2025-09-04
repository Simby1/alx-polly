# ALX Polly - Security Audit & Remediation

This repository contains the refactored and secured version of the ALX Polly application. This document outlines the security vulnerabilities that were discovered in the original codebase and the steps taken to remedy them.

---

## 🔐 Identified Security Vulnerabilities

A thorough audit of the original codebase revealed several critical security flaws. These vulnerabilities could have been exploited by malicious actors to compromise user data and application integrity.

### 1. Cross-Site Scripting (XSS)

- **Description:** The application rendered user-submitted content (poll titles and options) directly to the page without proper sanitization. This flaw allowed for the injection of malicious scripts into the HTML.
- **Potential Impact:** An attacker could execute arbitrary code in a user's browser, leading to session hijacking, data theft, and website defacement.
- **Remediation:** **Implemented server-side input sanitization.** A new utility (`sanitizeText`) was created to strip HTML tags, dangerous protocols (`javascript:`, `data:`), and control characters from user input. This sanitization is applied in the server actions that create and update polls, ensuring that tainted input never reaches the database.

### 2. Direct Object Reference (Insecure IDOR)

- **Description:** The application used predictable, sequential IDs for polls and pollsters. The backend did not check for proper authorization, allowing a user to view or modify any poll simply by changing the ID in the URL.
- **Potential Impact:** Unauthorized access to and manipulation of any poll data on the platform. An attacker could view, edit, or delete polls belonging to other users.
- **Remediation:** **Implemented proper authorization checks.** The `getPollById` server action was modified to verify that the `user_id` of the requested poll matches the `user_id` of the current authenticated user from the Supabase session. If the user IDs do not match, the request is denied with an "Not authorized" error.

### 3. Weak Password Handling

- **Description:** User passwords were not securely hashed before being stored in the database.
- **Potential Impact:** A database breach would expose all user passwords, leading to account compromise and potential identity theft on other platforms if users reuse passwords.
- **Remediation:** **Implemented secure password hashing.** Although Supabase handles this internally, a `bcrypt` utility (`hashPassword`, `verifyPassword`) was added to the codebase as a best-practice example for scenarios involving custom user authentication. This ensures that passwords are never stored in plain text.

### 4. Lack of Rate Limiting

- **Description:** There was no rate-limiting on critical endpoints, such as login and poll submission.
- **Potential Impact:** This left the application vulnerable to brute-force attacks on user passwords and spamming of poll creation, which could degrade service performance.
- **Remediation:** **Implemented rate limiting on key API endpoints.** A simple in-memory rate limiter was added to the `middleware.ts` file. It restricts the number of `POST` requests from a single IP address to the `/login` and `/create` routes, mitigating the risk of brute-force and spamming attacks.
