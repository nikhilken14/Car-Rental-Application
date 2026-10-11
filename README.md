# Roam — Car Rental Application

A React frontend and Spring Boot backend using PostgreSQL, with separate customer and renter portals. In this project, **renter means the vehicle owner or fleet provider**.

## Features

- Customer registration, login, logout, booking and active rental list.
- Renter registration, login, fleet management, adding vehicles, active rented-car list, returns and deletion of available vehicles.
- Search, filters, sorting, favorites, vehicle comparison and grid/list views.
- Session authentication, BCrypt password hashing, CSRF protection and role/ownership checks.
- Rented vehicles cannot be deleted until returned.

## Project layout

| Path | Purpose |
| --- | --- |
| `backend/pom.xml` | Spring Boot Maven project; open this in IntelliJ |
| `backend/src/main/java/com/car_rental/` | Backend application code |
| `backend/src/main/resources/application.properties` | Runtime configuration |
| `backend/src/test/` | Backend integration tests |
| `backend/mvnw.cmd`, `backend/mvnw`, `backend/.mvn/` | Maven wrapper; commit these files |
| `frontend/src/` | React application and tests |
| `frontend/public/` | Public frontend assets |
| `frontend/package.json`, `frontend/package-lock.json` | npm scripts and dependency lockfile |

The backend project is directly inside `backend/`; do not create another project inside it.

## Requirements

- JDK 17 or a compatible newer JDK; use the same JDK for IntelliJ and Maven.
- Node.js and npm compatible with the frontend dependencies.
- PostgreSQL running locally.
- Internet access for the first Maven/npm dependency installation.

## Database setup

If `car_rental` already exists, keep it. Otherwise, run this once through pgAdmin:

```sql
CREATE DATABASE car_rental;
```

In IntelliJ, open **Run → Edit Configurations → CarRentalApplication → Environment variables**. Add these as separate variables:

```text
DB_URL=jdbc:postgresql://localhost:5432/car_rental
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
FRONTEND_ORIGINS=http://localhost:3000
PORT=8080
```

Use the PostgreSQL user's password, not a car rental account password. Keep this in `application.properties`:

```properties
spring.datasource.password=${DB_PASSWORD:}
```

An unset `DB_PASSWORD` gives an empty password. Do not commit a real password in `application.properties`. Environment variables configured in an IntelliJ run configuration do not automatically apply to terminal commands.

The application's `ddl-auto=update` setting updates entity tables at startup. Back up an existing database before schema changes. No demo profile is needed for PostgreSQL.

## Run the backend in IntelliJ

1. Choose **File → Open**, select `backend/pom.xml`, and open it as a project.
2. Allow Maven to import dependencies and select the project JDK.
3. Configure the environment variables above.
4. Run `CarRentalApplication` without the `demo` profile.
5. Wait for `Started CarRentalApplication` in the console.
6. Open <http://localhost:8080/health> to check the HTTP application.

Alternatively, from a PowerShell terminal in `backend/`, set the variables for that terminal and run:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/car_rental"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="YOUR_POSTGRES_PASSWORD"
.\mvnw.cmd spring-boot:run
```

On Linux/macOS, with the same environment variables configured:

```bash
bash ./mvnw spring-boot:run
```

## Run the frontend in VS Code

Open `frontend/` in VS Code and run:

```bash
npm ci
npm start
```

Open <http://localhost:3000>. The default API address is `http://localhost:8080`.

To change it, create `frontend/.env.local`:

```dotenv
REACT_APP_API_URL=http://localhost:8080
```

Restart the frontend after changing this value. Use `localhost` consistently for both applications. Frontend environment values are included in the browser build; never put secrets in them.

Register a renter account to add your own vehicles, then register a customer with a different email address to test bookings.

## Test the application

From `frontend/`:

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

From `backend/` on Windows:

```powershell
.\mvnw.cmd test
```

On Linux/macOS:

```bash
bash ./mvnw test
```

The supplied backend tests use an isolated H2 database through the `demo` test profile. If you remove demo support, first move the H2 configuration into `src/test/resources/application-test.properties` and change the tests to `@ActiveProfiles("test")`. Keep H2 available to tests. Test databases must remain separate from your PostgreSQL data.

Frontend tests mock API calls. Also run these checks against the live backend:

| Check | Expected result |
| --- | --- |
| Register and sign in through each portal | Correct role accepted; wrong portal rejected |
| Renter adds a vehicle | Visible in their fleet and the customer catalog |
| Customer books for three days | Correct total; visible in My rentals and owner's Rented cars |
| Delete a rented vehicle | Blocked |
| Owner returns a vehicle | Removed from active rentals and available again |
| Cancel deletion, then confirm deletion | Cancel preserves vehicle; confirmation removes it |
| Sign in as a second renter/customer | Other accounts' private fleet/rentals are inaccessible |
| Customer attempts owner actions | Rejected by backend |
| Logout and reload | Account session does not restore |
| Search, filters, sorting, favorites and comparison | Correct results and state changes |
| Mobile and desktop widths | Usable layout with no horizontal overflow |

Use regular and incognito browser windows for independent customer and renter sessions. Check browser Network responses and IntelliJ logs when a request fails.

## Troubleshooting

| Problem | Action |
| --- | --- |
| SCRAM authentication requested but no password provided | Set `DB_PASSWORD` in the process that starts the backend |
| Password authentication failed | Check the PostgreSQL username and password |
| Connection refused | Check PostgreSQL is running and verify host/port |
| Port 8080 already in use | Stop the previous process or change both backend port and frontend API address |
| Maven project not recognized | Open `backend/pom.xml` and reload Maven |
| Existing cars do not appear | Check ownership: legacy cars with no `owner_id` must be assigned to the correct renter |
| API returns 401 | Sign in; an initial `/auth/me` 401 before login is expected |
| API returns 403 | Check role, ownership, session cookies and CSRF token |

## Push to GitHub

Place this README and `.gitignore` beside `backend/` and `frontend/`. Before staging, remove any real password from tracked configuration. A `.gitignore` does not remove secrets or generated files already tracked by Git.

From the project root, if this is not already a Git repository:

```bash
git init
git branch -M main
```

Review and commit:

```bash
git status
git add .
git diff --cached
git commit -m "Add car rental application"
```

Create an empty GitHub repository, then replace the example URL:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

If an `origin` remote already exists, check it using `git remote -v` instead of adding it again. Commit the Maven wrapper and npm lockfile. Do not commit dependency folders, build outputs, IDE files or credentials.

## Current scope

Bookings start immediately. Rental lists show active rentals; returning clears the current rental metadata. Future reservations, payment processing, booking history, password reset and email verification are not implemented.
