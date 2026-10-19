# Accounts and sync plan

## TL;DR

**Use Firebase Authentication, Cloud Firestore, and a small set of Cloud Functions.** Bradley manages a hosted project rather than a database server. Keep the vanilla game and add account-owned settings, permanent child accounts, and a durable offline sync queue.

Grown-ups sign in with Google or email and password. In class, a grown-up approves each shared Chromebook once; children then tap their picture to open their own account. Offer QR cards as an alternative, with picture selection as the fallback. At home, a signed-in grown-up selects their child. A teacher and family can access the same child account through an invitation.

**Replace the reading gate with actual adult authentication and permissions.** A classroom play session never grants adult access. Settings and progress follow accounts; browser storage is only an offline copy and a queue awaiting upload.

A different online Chromebook retrieves the child's saved work. An offline Chromebook can use accounts and content prepared on it earlier. Work still waiting on another disconnected machine cannot appear elsewhere until it uploads.

Planning estimate: **23–35 developer-days**, roughly five to seven working weeks for one experienced developer, including integration and testing. Start with a two-day shared-device/offline proof before committing to the full build.

## 1. Starting point and scope

The current game saves settings per world in browser storage. Its collection is an in-memory set that disappears on reload. There is no account identity to attach that collection to. The README also identifies the current offline checks as local-file checks, without a hosted service worker. These findings come from the current `design/codex/game/` source only.

This proposal replaces device-owned preferences with account-owned records. It adds durable learning history and achievements across Letter Post, Moonboat, and Silk Thread. It preserves Lucy's existing art and audio. It does not propose a framework rewrite.

This is a plan only. No game code, accounts, services, deployments, or billing settings have been changed. Privacy-law work is excluded as requested. Security below concerns correct access, account recovery, and preventing lost or misattributed work.

## 2. Backend recommendation

The table separates provider facts from our implementation estimates. Prices are USD list prices checked October 18, 2026, excluding tax and optional services.

| Option | Bradley's setup and upkeep | Running cost | Offline and sync | Security and fit |
| --- | --- | --- | --- | --- |
| **Firebase, recommended** | Create projects, enable login, choose database region, attach billing for Functions, approve deployment access. Provider operates the database and authentication service. | Usage-based. Budget **$0–$15/month initially** for a small classroom pilot, an estimate rather than a quote. Functions deployment/storage, traffic, and backups can add charges. | Firestore has browser persistence and automatic synchronization. Shared-device attribution, conflicts, and rejected uploads still require application design. Use the explicit queue below. | Auth, server functions, and database rules in one project. Server authorization remains our responsibility. Lowest expected operating burden for this pilot. |
| **Supabase** | Create a hosted project, configure Auth, tables, migrations, and row-level access policies. Provider operates Postgres. | Free for experiments; **Pro starts at $25/month**, before extras. Free projects can pause after one inactive week. | Budget the same application queue, or add a separate offline engine such as PowerSync. Realtime updates alone are not a durable offline queue. | Good relational model for classes and family relationships. A credible second choice, especially if SQL reporting becomes central. More initial schema/policy work and a higher baseline paid cost here. |
| **Bradley's host, PHP and MySQL** | Verify host features, implement authentication and API, manage schema, backups, restore checks, email delivery, monitoring, and updates. | Host-dependent. It might fit an existing plan, but the host's capacity and backup costs are unknown. No responsible exact quote yet. | Entire offline queue, retry protocol, conflict resolution, and incremental downloads are ours. MySQL alone does not provide browser synchronization. | Keep MySQL behind an HTTPS API. Use server sessions, password hashing, prepared statements, and authorization on every operation. Feasible, but the largest ongoing responsibility. |
| **PouchDB and hosted/self-hosted CouchDB** | Add a replication-oriented stack and arrange Auth, hosting, and access boundaries. | Provider-dependent; self-hosting adds operations work. | Strong replication model, including browser use. | Worth considering for a replication-heavy product. It introduces another stack without removing the account and permissions work this game needs. |

Firestore's documented offline behavior includes cached reads/writes and last-write-wins conflicts on a document. That helps, but does not by itself solve this job. [Firestore offline support](https://firebase.google.com/docs/firestore/manage-data/enable-offline).

Firebase currently includes 50,000 Firestore reads/day and 20,000 writes/day in its no-cost allowance; Functions require Blaze billing. At 30 children × 20 rounds, 600 activity events/day would imply roughly 600–1,800 writes if each accepted event needs one to three writes. Reads, other classes, functions, hosting, and backups are additional. This is a sizing example, not a measured bill. [Firebase pricing](https://firebase.google.com/pricing).

Supabase's pricing and offline integration support the comparison above. Adding an offline service may add another bill; price it before choosing that route. [Supabase pricing](https://supabase.com/pricing), [Supabase PowerSync integration](https://supabase.com/partners/catalog/powersync).

CouchDB and PouchDB support replication between servers and browser databases. The decision against them here is a project-fit judgment. [CouchDB](https://couchdb.apache.org/), [PouchDB replication](https://pouchdb.apache.org/guides/replication.html).

## 3. Accounts, roles, and ownership

A child has a permanent `playerId`, independent of any Chromebook, classroom, parent, or teacher. They have a managed account without an email address or typed password. A classroom device's login is a delegated way to access those accounts, not the owner of their records. Anonymous browser identities must never become the child's permanent identity.

An adult has one Auth identity and can hold different roles in different contexts. A parent who also teaches should not need two logins.

| Role | Access |
| --- | --- |
| Child/player | Play, view own collection and achievements, change allowed play preferences. No roster management, invitations, or adult settings. |
| Family grown-up | Manage linked children's home settings and view their history. Invite another approved grown-up. |
| Classroom grown-up | Manage assigned classes, rosters, classroom practice settings, device enrollment, and class progress. |
| Classroom owner | Also invite classroom staff and revoke classroom access. |
| Bradley/operator | Operate the service and handle explicit account recovery. No ordinary gameplay dependency on operator intervention. |

Use memberships rather than a global `isTeacher` flag. Linking a family to a school-created child uses a single-use invitation and an explicit confirmation of the existing child. Never merge by name or create a second school/home account silently.

Settings have explicit owners:

- Adult interface preferences follow the adult account.
- Child preferences, progress, collections, achievements, and resume position follow `playerId` across all devices.
- Practice assignments belong to a classroom or home context. In class, classroom assignments override the child's default letter set; home uses home assignments. Changing a classroom assignment should not silently replace the family's choices.
- Worlds remain distinct where meaningful, such as theme and collectible artwork. Shared letter history is recorded once with its world/context attached.

## 4. Child sign-in

### Shared classroom Chromebooks

1. A classroom grown-up signs in on their own device and creates a class roster with recognizable pictures or avatars.
2. Each Chromebook displays a short pairing code. The grown-up approves it for that class, without leaving their adult session on the child device.
3. The Chromebook receives a revocable, play-only device enrollment. It downloads the roster, permitted settings, child progress snapshots, and game assets while online. It shows **Ready for offline play** only after preparation completes.
4. A child opens the game and taps their picture. A large confirmation screen repeats the picture before play starts. No name typing or password is required.
5. **Change player** saves the current activity locally, ends the active selection, and returns to the picture roster. Every round already carries its child's permanent ID.

Recommend **supervised picture selection for the first release**. It is low-assurance selection within a teacher-authorized classroom, not proof that a particular child tapped their own picture. Children could choose a classmate. This tradeoff needs Bradley's confirmation before implementation.

QR cards can reduce wrong-picture selection when cameras work. Keep them optional because camera permission, aiming a card, and lost cards can complicate a three-year-old's day. On enrolled devices, a card can identify the roster entry without granting wider access. If a future card grants access on an unapproved device, it becomes a bearer credential and must be scoped and revocable. Do not print adult credentials in a QR code.

A spoken name would help children who struggle with pictures, but that would require a separate audio decision. The first release should use existing visuals without generating or changing Lucy's audio.

### At home

A grown-up signs in, creates or links a child account, and approves the home device for those children. The child chooses their picture on later visits. A new phone or tablet retrieves the same child records after the grown-up signs in. A school invitation links the existing school account; it does not start progress over.

## 5. Grown-up sign-in and gate

Offer **Continue with Google** and **email/password with password reset**. Google suits many classroom users; email/password avoids assuming every family uses Google. Do not use SMS for the first release.

Keep the Grown-ups entry, but remove the number-word check as an authorization mechanism. Opening management requires an adult login and the relevant membership. Returning from child play requires an explicit adult unlock, even if a valid adult session exists elsewhere.

Use separate play and management origins or equivalently isolated authentication contexts. Classroom play keeps only its limited device credential. Adult sessions on shared equipment are temporary and end when management closes; personal devices may offer a remembered login. Provider session persistence is configurable and distinct from cached game data. [Firebase Auth persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence).

New adult authentication, password resets, new enrollments, membership changes, and family linking require internet access. Previously authorized personal devices may display cached adult information and queue setting edits; shared classroom devices do not offer a fresh offline adult unlock. Revalidate queued adult edits when that same adult reconnects.

## 6. Proposed data model

These are logical entities, not a commitment to final collection paths.

| Entity | Main fields and purpose |
| --- | --- |
| Adult | `adultId`, Auth UID, display name, account preferences. |
| Player | `playerId`, display label, avatar, creation/version metadata. Permanent identity. |
| Classroom/home context | `contextId`, type, owner, label. |
| Membership | Subject, context/player, role, active/revoked status. Teacher and family relationships can point to the same player. |
| Device enrollment | `deviceId`, device Auth UID, allowed context/roster, grant version, status. Grants play access only. |
| Settings | Owner/context, world, individual setting values, per-field revisions, actor. Includes letters, sound, and theme. |
| Activity event | Unique `eventId`, `playerId`, context, world, letter, outcome, attempts/hints, activity/content version, source device/grant, local sequence, observed time, server receipt time. Immutable after acceptance. |
| Progress summary | Per-player letter history, collection, counts, resume position, and processing version. Rebuildable from accepted events. |
| Achievement | Player, achievement definition/version, qualifying evidence, awarded time. Deterministic identity prevents duplicate awards. |
| Invitation | Intended relationship, hashed single-use token, expiry, accepted/revoked state. |

A correct picture after hints remains an activity result, not a mastery claim. Keep the existing visit collection as a visit view and add the persistent collection/history separately. Do not convert unowned browser preferences or old visit data into a child's history automatically. Offer an explicit adult-confirmed settings import; old in-memory visits cannot be reconstructed after reload.

## 7. Offline and synchronization

### One local repository, one durable queue

Store prepared snapshots and pending operations in IndexedDB, partitioned by player/context and actor. A completed activity is first written durably with a unique event ID. Only then show it as **Saved on this device**. Network acknowledgement changes that to **Synced**. Quota or storage failures must not show a successful save.

Use an application-owned queue for child events and setting commands. Do not depend on Firestore's SDK queue as the sole recoverable copy or add a second competing write path. Firestore remains the hosted store; the app controls attribution, retries, and conflict behavior.

A classroom enrollment uses a stable Firebase device identity. Trusted server functions can issue its credentials after enrollment approval. It does not sign in as a different Firebase user every time a child changes pictures. Custom authentication needs a trusted token issuer; service credentials stay on the server. [Firebase custom authentication](https://firebase.google.com/docs/auth/web/custom-auth).

### Upload and ownership rules

- Every queued operation permanently records its original player, actor, device, grant version, operation ID, and sequence. Selecting another child never rewrites those fields.
- Classroom and home play queues upload under their enrolled device's authority. Adult management commands upload only under the original adult's authenticated authority.
- A server function validates the live enrollment/membership and payload, then accepts each event ID once. A retry after a lost response returns the original result rather than incrementing progress again.
- The server derives progress and achievements from accepted events. Never replace all progress with an old offline document.
- Keep local operations until acknowledged. A revoked grant or invalid command moves work into a visible unresolved state for adult recovery. Do not silently discard it or retry forever as another user.
- Sync on launch, reconnect, return to the app, and while it remains open. Do not rely on a browser running background work after the tab closes.

Do not clear caches as a shortcut for switching children. Firebase explicitly documents that clearing its IndexedDB persistence also deletes pending writes. [Firestore JavaScript reference](https://firebase.google.com/docs/reference/js/firestore#clearindexeddbpersistence).

### Conflicts

Additive activity history merges across devices. Achievement processing is idempotent and versioned. Replaying one completed upload cannot award it twice. Resume position is a convenience field with an explicit server-accepted ordering, separate from history; concurrent play cannot erase either activity.

For settings, send a changed field with its expected revision. The server accepts it when that revision still matches. Otherwise, show the grown-up the current value and their proposed value to choose again. This avoids an old offline letter list overwriting a newer one. Classroom and home settings have separate scopes. Device clocks are not authoritative conflict resolvers.

### Offline application and honest limits

Add an HTTPS service worker that caches the shell, local SDK bundle, fonts, approved art, and all required audio. Show download/preparation status; merely visiting the chooser is not proof that every activity is cached. Version caches so updates do not delete assets needed by a pending activity. [MDN service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

| Situation | Expected behavior |
| --- | --- |
| Child picks any prepared online Chromebook | Retrieve current server state and play as that child. |
| Prepared Chromebook is offline | Select an authorized cached player; use cached settings/history; queue new work. |
| Chromebook has never prepared that class/player | Connect once for enrollment and data download. Do not invent a new child account offline. |
| Child used A offline, then uses B online | B sees the last server state. A's new work appears after A uploads. |
| Browser data is erased before upload | Unsynced work may be unrecoverable. Server-synced work returns after sign-in. |

This meets device-independent ownership and eventual sync. No backend can transfer work that remains only on a disconnected or erased machine. Classroom preparation must check whether managed Chromebook profiles preserve site data across logout/reboot. If policy wipes it, prioritize online upload before handoff and make that limitation visible.

## 8. Security that supports the game

Use HTTPS, server-validated memberships, revocable device enrollments, bounded payloads, and rate limits on enrollment, login exchange, and upload endpoints. Database access defaults to denied. Children/device principals cannot edit roles, invitations, accepted history, or server-derived achievements.

Server SDKs bypass Firestore client rules, so the upload/enrollment functions must enforce permissions themselves. Use rule tests for direct client access as well. [Firestore rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

A classroom cache intentionally contains authorized roster data. Switching players must detach old listeners, remove the old child's visible state, and load the selected account. Coordinate tabs so two tabs cannot accidentally reuse one active player selection. The original event owner remains fixed regardless of tab state.

For a PHP/MySQL alternative, the same access and queue rules still apply. PHP supplies password hashing and prepared statements, but integrating secure sessions, recovery, and deployment remains our work. [PHP password hashing](https://www.php.net/manual/en/function.password-hash.php), [PDO prepared statements](https://www.php.net/manual/en/pdo.prepared-statements.php).

## 9. What Bradley must set up

1. Approve Firebase and the classroom selection model. Nominate a Google account to own development and production projects.
2. Attach Blaze billing for server functions. Choose a region before data creation. Configure usage alerts and function limits; an alerts-only budget does not cap charges. [Google Cloud budget documentation](https://docs.cloud.google.com/billing/docs/how-to/budgets).
3. Choose the production domain and approve DNS changes for play and adult management. Static Firebase Hosting is an option; no server-rendered App Hosting product is needed.
4. Enable Google and email/password login, approved domains, and recovery email settings. Give deployment access without sharing account passwords.
5. Supply one pilot class roster, recognizable avatars, one classroom grown-up account, and one family test account. No child email addresses are required.
6. Arrange access to two representative Chromebooks and the actual shared-browser/profile policy for the offline proof. Confirm camera availability only if QR is part of the pilot.
7. Approve a backup/export and restore schedule, plus a person who receives failed-sync and billing alerts.

Estimate Bradley's initial console/domain work at one to three hours with assistance, excluding school administration delays and roster preparation. This is an estimate, not a required database-maintenance role.

## 10. Build phases and acceptance checks

Estimates assume one experienced developer, the existing game stays vanilla, no school SSO integration, and no custom media production. Waiting for access and Bradley's review is additional.

| Phase | Developer effort | Reviewable result |
| --- | --- | --- |
| 0. Prove the risky path | 2 days | Two browsers, three players, prepared offline use, reboot, switch player before upload, duplicate retry, correct owner after reconnect. No visual capture. |
| 1. Identity and backend | 3–4 days | Adult login/recovery, stable players, memberships, enrollment, deny-by-default access, emulator checks. |
| 2. Login flows and linking | 3–5 days | Picture roster, child confirmation, change player, home selection, family invitation, adult unlock, QR if chosen. |
| 3. Durable sync and conflicts | 5–8 days | Queue, idempotent ingestion, snapshots, progress/achievement processing, settings conflicts, rejected-upload recovery. |
| 4. Hosted offline game integration | 4–6 days | Service worker, preparation/readiness, all three worlds using account settings/history, explicit legacy import. |
| 5. Classroom pilot and recovery | 3–5 days | Thirty-client exercise, cross-device journeys, storage loss, revocation, restore drill, operating notes. |
| **Subtotal** | **20–30 days** | Functional pilot. |
| **Contingency** | **3–5 days** | Browser/profile and school-network surprises. |
| **Total** | **23–35 days** | Approximately five to seven working weeks. |

Sequence the shared identity/queue contracts first. Backend/rules and game UI can proceed separately after those contracts stabilize; one owner controls schema changes. This avoids parallel implementations of different ownership rules.

Before release, prove A-to-B progress transfer; parent-to-teacher continuity; offline A-to-B-to-A switching; reboot with pending work; response loss followed by retry; concurrent settings edits; role revocation; wrong-account rejection; storage exhaustion; and browser-profile clearing. Run existing learning/audio/motion checks with screenshot capture disabled. Bradley performs visual review manually. No tests or screenshot capture were run for this planning-only job.

## 11. Risks and decisions for Bradley

The largest risks are incorrect child selection, erased unsynced storage, duplicate school/home identities, delayed revocation during offline play, and conflicting adult settings. The design above gives each a specific handling rule. Firebase dependence and metered traffic remain tradeoffs; keep an exportable event model and monitor actual pilot usage before promising a cost.

Please decide these before implementation:

1. **Is supervised picture selection sufficient in class?** Recommended yes, on enrolled devices; optional QR identification. If each child must prove identity independently, the login design and estimate need revision.
2. **Can classroom browser storage survive logout/reboot?** School IT must confirm. This determines how reliably offline work can await upload.
3. **Should school and home share one child history?** Recommended yes, with explicit invitation linking and separate practice assignments. Confirm who may approve a link or resolve duplicate accounts.
4. **Is the Firebase billing account and estimated $0–$15/month pilot budget acceptable?** It is usage-based, not a fixed cap. If a hard fixed hosting bill is essential, revisit the self-hosted option with the actual host specification.
5. **Who owns the first pilot and what devices are available?** Recommend one class, two Chromebooks for the initial proof, then the full 20–30-device set and a family device.

The plan stops here for Bradley's decisions. No implementation is authorized by this document.
