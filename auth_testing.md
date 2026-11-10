# Auth testing playbook (Sapa Food)

1. MongoDB: `db.users.find({role:"admin"})` → bcrypt hash starts with `$2b$`; unique index on users.email; index login_attempts.identifier.
2. API:
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
curl -c c.txt -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@sapa-food.cz","password":"Sapa-tlWaTuUHUpYDvdD5!"}'
curl -b c.txt $API/api/auth/me
```
Login returns user and sets httpOnly cookies access_token + refresh_token (SameSite=Lax, Secure).
3. Unauthenticated calls to /api/admin/* must return 401.
4. 5 wrong passwords for the same ip+email → 429 lockout for 15 minutes (avoid tripping it for the real admin during tests).
