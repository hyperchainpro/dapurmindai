---
Task ID: 1
Agent: Main Agent
Task: Migrate DapurMind backend from SQLite to PostgreSQL + add user & system management

Work Log:
- Installed PostgreSQL 17.10 from Debian packages (extracted debs in user space since no root access)
- Initialized PostgreSQL data directory at /home/z/pgsql-data
- Created dapurmind database on localhost:5432
- Completely rewrote prisma/schema.prisma: changed provider to postgresql, added proper foreign key relations (User→CreatorRecipe, User→FinanceRecord, etc.), added new models (Session, ActivityLog, SystemSetting), added @@map for table names, added indexes
- Installed bcryptjs + jose packages for password hashing and JWT
- Created src/lib/auth-server.ts: comprehensive auth library with hashPassword, verifyPassword, createToken (JWT HS256), verifyToken, createSession, validateSession, deleteSession, requireAuth, requireAdmin, logActivity, AuthError class
- Rewrote api/auth/register/route.ts: uses PostgreSQL + bcrypt password hashing + JWT session
- Rewrote api/auth/login/route.ts: uses PostgreSQL + bcrypt + JWT, supports login by username or email
- Rewrote api/auth/reset-password/route.ts: uses PostgreSQL, verifies current password, invalidates all sessions on reset
- Rewrote api/auth/profile/route.ts: added GET (current profile), PUT (update), POST (avatar upload) - all with auth
- Created api/auth/logout/route.ts: invalidates session on logout
- Created api/auth/me/route.ts: returns current user with related counts
- Created api/admin/users/route.ts: GET (list with search, pagination, sorting, role filter) + POST (create user as admin)
- Created api/admin/users/[id]/route.ts: GET (detail with full relations), PUT (update role, email, password, status), DELETE (soft delete)
- Created api/admin/activity-logs/route.ts: GET with pagination, user filter, action filter, date range
- Created api/admin/settings/route.ts: GET (list all), PUT (batch update), POST (upsert single)
- Created api/admin/stats/route.ts: comprehensive dashboard stats (users, recipes, finance, affiliate, AI, sessions, activity logs, growth charts)
- Fixed api/affiliate/analytics/route.ts: converted SQLite raw SQL to PostgreSQL syntax
- Fixed api/creator/profile/route.ts: removed broken User→CreatorRecipe relation query, replaced with groupBy approach
- Updated start-server.sh to auto-start PostgreSQL and set DATABASE_URL
- Updated .env to use PostgreSQL connection string
- Built, deployed, and verified all APIs work correctly

Stage Summary:
- PostgreSQL 17.10 running at 127.0.0.1:5432/dapurmind
- All 13 models migrated with proper relations and indexes
- Auth system completely rewritten: bcrypt hashed passwords, JWT sessions, activity logging
- 7 new admin API endpoints for user management, activity logs, settings, and dashboard stats
- All existing API routes continue to work with PostgreSQL
- Admin user created: admin@dapurmind.com / admin123 (superadmin role)
- Deployed via PM2, all endpoints verified working
