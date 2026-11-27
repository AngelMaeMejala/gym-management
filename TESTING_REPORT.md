# FitZone final submission audit

ITEC 116 Systems Integration and Architecture 2. Verified **27 November 2026** in Asia/Manila.

| Total cases | Passed | Failed | Passing rate |
| ---: | ---: | ---: | ---: |
| 177 | 177 | 0 | 100.0% |

Each numbered row counts as one case. Newman, the existing smoke suite, and the repeated clean-install suite are grouped cases, so their individual assertions are not added to the total.

## Completion and coverage

| Area | Verified result |
| --- | --- |
| Authentication and account security | Administrator and member sign-in and logout, registration, case-insensitive duplicate email rejection, bcrypt cost 12, HS256 JWT issuance and two-hour lifetime, missing and invalid token rejection, validly signed expired token rejection, role restrictions and booking ownership. |
| Schedules, members, bookings, and notifications | Admin member CRUD with deactivation, schedule CRUD and overlap prevention, member booking submission and update, admin approval and rejection, cancellation, and notification visibility and read status. Chrome verified booking decisions across both roles. |
| Equipment, stock, and suppliers | Equipment and stock lifecycle, inventory quantity validation, derived availability, admin-only supplier CRUD, supplier assignment and removal, one-to-many inventory display, rejection of linked supplier deletion, and fictional seed data. Chrome verified supplier creation, detail, search, equipment dropdowns and the inventory display. |
| Profile and storage | Browser profile picture upload and reappearance on second sign-in, multipart API validation, byte and MIME verification, and retention after API restart. |
| Database and integration | XAMPP on 3306, API on 3000, Vite on 5173, CORS and proxy, six migrations, eight tables, seven foreign keys, migration-only startup, sanitized SQL import, and preservation of live records after restart. |
| Postman | Newman executed 59 requests and 65 assertions with 0 failures. Coverage was checked against all 38 registered routes. |

## Findings resolved

- The earlier collection omitted several registered routes and some cross-role workflows. The updated collection covers all routes, uses randomized test identities, and includes a fictional multipart upload fixture.
- SQL setup previously included database creation only. The sanitized export now includes every current table, foreign key, and constraint. An isolated XAMPP import created eight empty tables, and the application applied migrations and seeded fictional suppliers after startup.
- Installation and verification instructions now cover the default XAMPP ports, fresh setup and SQL import, the Vite proxy, and private Postman environment settings. Git ignores Postman environments and additional SQL backups placed under `database/`.
- No application runtime defect reproduced in the final suites. Live verification compared all eight tables before and after restart. Row contents matched, and the audit used disposable schemas for write-heavy cases.

## Results

| ID | Module | Scenario | Expected | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| FT-001 | Live XAMPP | Application MySQL credentials work on the configured listener | 3306 | 3306 | Pass |
| FT-002 | Live XAMPP | All six TypeORM migrations recorded | 6 | 6 | Pass |
| FT-003 | Live XAMPP | Live schema has all foreign key relationships | 7 | 7 | Pass |
| FT-004 | Live XAMPP | Export excludes private records and destructive statements | 8 DDL statements only | 8 DDL statements only | Pass |
| FT-005 | Live XAMPP | Live API ready before restart | 401 | 401 | Pass |
| FT-006 | Live XAMPP | Rebuilt NestJS starts on port 3000 | 401 | 401 | Pass |
| FT-007 | Live XAMPP | All eight live tables retain the same rows after API restart | 8 matching tables | 8 matching tables | Pass |
| FT-008 | Live XAMPP | Vite serves FitZone on port 5173 | 200 | 200 | Pass |
| FT-009 | Live XAMPP | Vite proxies protected supplier API | 401 | 401 | Pass |
| FT-010 | Live XAMPP | API responds to Vite CORS preflight | 204; configured origin | 204; configured origin | Pass |
| FT-011 | Integration | XAMPP MariaDB responds on TCP 3306 | Assertion succeeds | SQL query confirmed port 3306 | Pass |
| FT-012 | Integration | Sanitized SQL import succeeds | Assertion succeeds | XAMPP client exit 0 | Pass |
| FT-013 | Integration | Export imports all eight tables without data | Assertion succeeds | Verified | Pass |
| FT-014 | Integration | Restricted database account authenticates | Assertion succeeds | Connected to isolated schema | Pass |
| FT-015 | Integration | NestJS starts and runs migrations on XAMPP | Assertion succeeds | Protected endpoint responded on isolated API port 3100 | Pass |
| FT-016 | Integration | Browser preflight | 204 | 204 | Pass |
| FT-017 | Integration | Configured CORS origin and auth header | Assertion succeeds | Verified | Pass |
| FT-018 | Integration | Unconfigured origin receives no CORS authorization | Assertion succeeds | Verified | Pass |
| FT-019 | Authentication and security | Missing token | 401 | 401 | Pass |
| FT-020 | Authentication and security | Invalid token | 401 | 401 | Pass |
| FT-021 | Authentication and security | Invalid credentials | 401 | 401 | Pass |
| FT-022 | Authentication and security | Administrator login | 200 | 200 | Pass |
| FT-023 | Authentication and security | Valid HS256 token has a two-hour lifetime | Assertion succeeds | Verified | Pass |
| FT-024 | Authentication and security | Expired but correctly signed token | 401 | 401 | Pass |
| FT-025 | Authentication and security | Read administrator account details | 200 | 200 | Pass |
| FT-026 | Authentication and security | Account response contains role and omits password | Assertion succeeds | Verified | Pass |
| FT-027 | Authentication and security | Reject invalid email and extra input | 400 | 400 | Pass |
| FT-028 | Authentication and security | Reject mismatched passwords | 400 | 400 | Pass |
| FT-029 | Authentication and security | Register member | 201 | 201 | Pass |
| FT-030 | Authentication and security | Reject case-insensitive duplicate email | 409 | 409 | Pass |
| FT-031 | Authentication and security | Member login | 200 | 200 | Pass |
| FT-032 | Authentication and security | Stored registration password is bcrypt cost 12 | Assertion succeeds | Verified | Pass |
| FT-033 | Authentication and security | Read member account details through Vite proxy | 200 | 200 | Pass |
| FT-034 | Authentication and security | Member role and account details | Assertion succeeds | Verified | Pass |
| FT-035 | Authentication and security | Member denied user management | 403 | 403 | Pass |
| FT-036 | Authentication and security | Member denied inventory management | 403 | 403 | Pass |
| FT-037 | Authentication and security | Admin denied member booking creation | 403 | 403 | Pass |
| FT-038 | Dashboards and member management | Admin dashboard API | 200 | 200 | Pass |
| FT-039 | Dashboards and member management | Member dashboard API | 200 | 200 | Pass |
| FT-040 | Dashboards and member management | Admin creates member | 201 | 201 | Pass |
| FT-041 | Dashboards and member management | Admin lists members | 200 | 200 | Pass |
| FT-042 | Dashboards and member management | Created member is listed | Assertion succeeds | Verified | Pass |
| FT-043 | Dashboards and member management | Admin edits member | 200 | 200 | Pass |
| FT-044 | Dashboards and member management | Member update returned edited details | Assertion succeeds | Verified | Pass |
| FT-045 | Schedules and bookings | Create schedule | 201 | 201 | Pass |
| FT-046 | Schedules and bookings | Reject schedule overlap | 409 | 409 | Pass |
| FT-047 | Schedules and bookings | Update schedule | 200 | 200 | Pass |
| FT-048 | Schedules and bookings | Member lists schedules | 200 | 200 | Pass |
| FT-049 | Schedules and bookings | Updated schedule returned by read endpoint | Assertion succeeds | Verified | Pass |
| FT-050 | Schedules and bookings | Delete schedule | 204 | 204 | Pass |
| FT-051 | Schedules and bookings | Submit member booking 12:00 | 201 | 201 | Pass |
| FT-052 | Schedules and bookings | New booking starts pending | Assertion succeeds | Verified | Pass |
| FT-053 | Schedules and bookings | Reject overlapping member booking | 409 | 409 | Pass |
| FT-054 | Schedules and bookings | Submit member booking 13:00 | 201 | 201 | Pass |
| FT-055 | Schedules and bookings | Submit member booking 14:00 | 201 | 201 | Pass |
| FT-056 | Schedules and bookings | Member cannot approve booking | 403 | 403 | Pass |
| FT-057 | Schedules and bookings | Admin approves booking | 200 | 200 | Pass |
| FT-058 | Schedules and bookings | Reject second decision | 409 | 409 | Pass |
| FT-059 | Schedules and bookings | Admin rejects booking | 200 | 200 | Pass |
| FT-060 | Schedules and bookings | Member cancels own booking | 200 | 200 | Pass |
| FT-061 | Schedules and bookings | Booking decisions and cancellation return correct states | Assertion succeeds | Verified | Pass |
| FT-062 | Schedules and bookings | Admin lists bookings | 200 | 200 | Pass |
| FT-063 | Schedules and bookings | Member lists own bookings | 200 | 200 | Pass |
| FT-064 | Schedules and bookings | Booking lists contain all three persisted state changes | Assertion succeeds | Verified | Pass |
| FT-065 | Notifications | Read admin notifications | 200 | 200 | Pass |
| FT-066 | Notifications | Read member notifications | 200 | 200 | Pass |
| FT-067 | Notifications | Member received both booking decisions | Assertion succeeds | Verified | Pass |
| FT-068 | Notifications | Admin receives schedule notifications | Assertion succeeds | Verified | Pass |
| FT-069 | Notifications | Cross-account notification updates are rejected | 404 | 404 | Pass |
| FT-070 | Notifications | Member marks notification read | 200 | 200 | Pass |
| FT-071 | Notifications | Notification status persisted as READ | Assertion succeeds | Verified | Pass |
| FT-072 | Equipment and inventory | Member denied equipment creation | 403 | 403 | Pass |
| FT-073 | Equipment and inventory | Reject invalid equipment condition | 400 | 400 | Pass |
| FT-074 | Equipment and inventory | Create equipment and linked inventory | 201 | 201 | Pass |
| FT-075 | Equipment and inventory | List inventory | 200 | 200 | Pass |
| FT-076 | Equipment and inventory | New equipment starts unavailable with zero stock | Assertion succeeds | Verified | Pass |
| FT-077 | Equipment and inventory | Reject negative stock | 400 | 400 | Pass |
| FT-078 | Equipment and inventory | Update inventory quantity | 200 | 200 | Pass |
| FT-079 | Equipment and inventory | Member views equipment availability | 200 | 200 | Pass |
| FT-080 | Equipment and inventory | Positive stock makes good equipment available | Assertion succeeds | Verified | Pass |
| FT-081 | Equipment and inventory | Edit equipment condition | 200 | 200 | Pass |
| FT-082 | Equipment and inventory | Repair condition overrides stock availability | Assertion succeeds | Verified | Pass |
| FT-083 | Profile pictures | New member has no profile picture | 404 | 404 | Pass |
| FT-084 | Profile pictures | Admin denied member-only upload | 403 | 403 | Pass |
| FT-085 | Profile pictures | Reject invalid image content | 400 | 400 | Pass |
| FT-086 | Profile pictures | Upload PNG | 204 | 204 | Pass |
| FT-087 | Profile pictures | Download profile picture | 200 | 200 | Pass |
| FT-088 | Profile pictures | Profile picture bytes and MIME type match | Assertion succeeds | Verified | Pass |
| FT-089 | Extended CRUD | Read member by ID | 200 | 200 | Pass |
| FT-090 | Extended CRUD | Member denied user detail endpoint | 403 | 403 | Pass |
| FT-091 | Extended CRUD | Member deletion cannot deactivate administrator | 404 | 404 | Pass |
| FT-092 | Extended CRUD | Deactivate member through DELETE | 204 | 204 | Pass |
| FT-093 | Extended CRUD | Read retained member record | 200 | 200 | Pass |
| FT-094 | Extended CRUD | Member deletion preserves history and disables account | Assertion succeeds | Verified | Pass |
| FT-095 | Extended CRUD | Deactivated member cannot sign in | 401 | 401 | Pass |
| FT-096 | Extended CRUD | Create schedule for detail tests | 201 | 201 | Pass |
| FT-097 | Extended CRUD | Member reads visible schedule by ID | 200 | 200 | Pass |
| FT-098 | Extended CRUD | Cancel schedule for detail authorization | 200 | 200 | Pass |
| FT-099 | Extended CRUD | Member cannot read cancelled schedule by ID | 404 | 404 | Pass |
| FT-100 | Extended CRUD | Admin can read cancelled schedule | 200 | 200 | Pass |
| FT-101 | Extended CRUD | Delete detail test schedule | 204 | 204 | Pass |
| FT-102 | Extended CRUD | Submit member booking 17:00 | 201 | 201 | Pass |
| FT-103 | Extended CRUD | Admin reads booking by ID | 200 | 200 | Pass |
| FT-104 | Extended CRUD | Member edits own pending booking | 200 | 200 | Pass |
| FT-105 | Extended CRUD | Booking change persisted with same ID | Assertion succeeds | Verified | Pass |
| FT-106 | Extended CRUD | Approved booking cannot be edited | 409 | 409 | Pass |
| FT-107 | Extended CRUD | Register second member for ownership checks | 201 | 201 | Pass |
| FT-108 | Extended CRUD | Second member signs in | 200 | 200 | Pass |
| FT-109 | Extended CRUD | Other member cannot read booking | 404 | 404 | Pass |
| FT-110 | Extended CRUD | Other member cannot edit booking | 404 | 404 | Pass |
| FT-111 | Extended CRUD | Other member cannot delete booking | 404 | 404 | Pass |
| FT-112 | Extended CRUD | Member cancels booking through DELETE | 204 | 204 | Pass |
| FT-113 | Extended CRUD | Read retained booking history | 200 | 200 | Pass |
| FT-114 | Extended CRUD | Booking deletion records cancelled status | Assertion succeeds | Verified | Pass |
| FT-115 | Extended CRUD | Read equipment by ID | 200 | 200 | Pass |
| FT-116 | Extended CRUD | Read inventory by ID | 200 | 200 | Pass |
| FT-117 | Extended CRUD | Member denied inventory detail endpoint | 403 | 403 | Pass |
| FT-118 | Supplier management | Anonymous supplier access denied | 401 | 401 | Pass |
| FT-119 | Supplier management | Member supplier access denied | 403 | 403 | Pass |
| FT-120 | Supplier management | Reject invalid supplier phone | 400 | 400 | Pass |
| FT-121 | Supplier management | Create supplier | 201 | 201 | Pass |
| FT-122 | Supplier management | Reject duplicate supplier name | 409 | 409 | Pass |
| FT-123 | Supplier management | List suppliers | 200 | 200 | Pass |
| FT-124 | Supplier management | Supplier appears in list | Assertion succeeds | Verified | Pass |
| FT-125 | Supplier management | Get supplier details | 200 | 200 | Pass |
| FT-126 | Supplier management | Update supplier contact information | 200 | 200 | Pass |
| FT-127 | Supplier management | Three fictional suppliers are seeded | Assertion succeeds | Verified | Pass |
| FT-128 | Supplier management | Reject invalid supplier status | 400 | 400 | Pass |
| FT-129 | Supplier management | Reject member supplier edit | 403 | 403 | Pass |
| FT-130 | Supplier management | Reject member supplier detail | 403 | 403 | Pass |
| FT-131 | Supplier management | Reject member supplier delete | 403 | 403 | Pass |
| FT-132 | Supplier management | Reject member supplier creation | 403 | 403 | Pass |
| FT-133 | Supplier management | Reject nonexistent supplier assignment | 400 | 400 | Pass |
| FT-134 | Supplier management | Create equipment with supplier | 201 | 201 | Pass |
| FT-135 | Supplier management | Assign same supplier to existing equipment | 200 | 200 | Pass |
| FT-136 | Supplier management | Read linked suppliers in inventory | 200 | 200 | Pass |
| FT-137 | Supplier management | One supplier linked to two equipment rows without private contact fields | Assertion succeeds | Verified | Pass |
| FT-138 | Supplier management | Reject deletion of linked supplier | 409 | 409 | Pass |
| FT-139 | Supplier management | Delete first linked test equipment | 204 | 204 | Pass |
| FT-140 | Supplier management | Legacy equipment edit preserves supplier | 200 | 200 | Pass |
| FT-141 | Supplier management | Omitted supplier ID keeps assignment | Assertion succeeds | Verified | Pass |
| FT-142 | Restart persistence | Read profile picture after API restart | 200 | 200 | Pass |
| FT-143 | Restart persistence | Read bookings after API restart | 200 | 200 | Pass |
| FT-144 | Restart persistence | Read stock after API restart | 200 | 200 | Pass |
| FT-145 | Restart persistence | Read notifications after API restart | 200 | 200 | Pass |
| FT-146 | Restart persistence | SQL member edit, booking states, stock, notification and image survived restart | Assertion succeeds | Verified | Pass |
| FT-147 | Equipment and inventory | Equipment supplier assignment survives restart | Assertion succeeds | Verified | Pass |
| FT-148 | Equipment and inventory | Clear equipment supplier | 200 | 200 | Pass |
| FT-149 | Equipment and inventory | Explicit null clears assignment | Assertion succeeds | Verified | Pass |
| FT-150 | Equipment and inventory | Delete equipment | 204 | 204 | Pass |
| FT-151 | Equipment and inventory | Check stock after equipment deletion | 200 | 200 | Pass |
| FT-152 | Equipment and inventory | Equipment deletion cascades to linked inventory | Assertion succeeds | Verified | Pass |
| FT-153 | Supplier management | Read supplier after restart | 200 | 200 | Pass |
| FT-154 | Supplier management | Supplier contact edit persisted | Assertion succeeds | Verified | Pass |
| FT-155 | Supplier management | Delete supplier | 204 | 204 | Pass |
| FT-156 | Supplier management | Deleted supplier no longer exists | 404 | 404 | Pass |
| FT-157 | Browser | Admin sign-in and dashboard in Chrome | Assertion succeeds | Dashboard rendered after authenticated API calls | Pass |
| FT-158 | Browser | Admin creates supplier through browser | Assertion succeeds | Supplier displayed after API write | Pass |
| FT-159 | Browser | Supplier details and search in Chrome | Assertion succeeds | Verified | Pass |
| FT-160 | Browser | Equipment Add and Edit dropdown and inventory supplier in Chrome | Assertion succeeds | Verified | Pass |
| FT-161 | Browser | Admin logout | Assertion succeeds | Returned to sign-in and session storage cleared | Pass |
| FT-162 | Browser | Member registration in Chrome | Assertion succeeds | Confirmation displayed | Pass |
| FT-163 | Browser | Member login and account details | Assertion succeeds | Verified | Pass |
| FT-164 | Browser | Profile picture upload via Chrome | Assertion succeeds | Verified | Pass |
| FT-165 | Browser | Member submits two booking requests in Chrome | Assertion succeeds | Verified | Pass |
| FT-166 | Browser | Member dashboard in Chrome | Assertion succeeds | Booking summary rendered | Pass |
| FT-167 | Browser | Member logout | Assertion succeeds | Returned to sign-in and session storage cleared | Pass |
| FT-168 | Browser | Administrator approves and rejects browser bookings | Assertion succeeds | Verified | Pass |
| FT-169 | Browser | Member sees decisions, notification and persisted picture in Chrome | Assertion succeeds | Verified | Pass |
| FT-170 | Regression | Existing API regression suite | Assertion succeeds | Passed 45 API checks. | Pass |
| FT-171 | Postman | Run complete Postman collection with Newman | Assertion succeeds | 59 requests and 65 assertions passed | Pass |
| FT-172 | Clean install | Run the complete API suite on an empty schema created by TypeORM | All fresh-schema checks pass | 145/145 checks passed | Pass |
| FT-173 | Clean install | Run database/setup.sql on the configured XAMPP instance | Idempotent setup exits 0 | Exit 0 | Pass |
| FT-174 | Build | Compile NestJS and build React production assets | Both builds exit 0 | Both builds exit 0 | Pass |
| FT-175 | Repository hygiene | Scan reachable local history and submission candidates for private values and filenames | No matches | No matches across 2 commits and 43 unique historical blobs | Pass |
| FT-176 | Repository hygiene | Confirm configured GitHub branch and tag tips are covered by the scan | Every remote tip covered | 1 remote ref covered | Pass |
| FT-177 | Cleanup | Remove isolated database schemas, accounts and upload directories | No isolated resources remain | No isolated resources remain | Pass |

## Remaining limits

- Browser sign-out clears the local session. An issued JWT can remain valid until it expires while its account remains active. Account deactivation disables API access.
- Member removal deactivates the account, booking removal records cancellation, and inventory creation and deletion follow the linked equipment. The application preserves member and booking history.
- The database validation used XAMPP MariaDB. Oracle MySQL was not separately exercised.
- The GitHub check covered the configured repository branch and tag tips at audit time plus reachable local history. Local submission changes were scanned separately. They were not pushed as part of this audit.

Artifacts: [README](README.md), [database setup](database/setup.sql), [sanitized schema](database/schema.sql), [Postman collection](postman/Gym%20Management.postman_collection.json), and [API smoke suite](scripts/smoke-api.cjs).
