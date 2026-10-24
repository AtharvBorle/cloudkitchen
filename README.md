# Neo Cloud Bites (Cloud Kitchen Platform)

Next.js monorepo featuring customer ordering, seller kitchens, delivery rider dashboards, admin operations, and high-performance transactional services.

## Runtime & Engine Requirements

In accordance with official Node.js security advisories, this application requires a supported, patched LTS runtime:

- **Recommended LTS**: **Node.js 24.22.1**
- **Supported LTS**: **Node.js 22.23.4**
- **npm**: `>= 10.0.0`

Use `nvm` or your preferred Node version manager:

```bash
nvm use
# or
nvm install 24.22.1 && nvm use 24.22.1
```

## Security & Hardening Configuration

1. **Authentication & Authorization**:
   - RBAC enforced across User, Seller, Delivery, Agent, and Superadmin roles.
   - Cryptographically random 6-digit OTP generation using Node.js `crypto.randomInt()`.
   - Timing-safe constant-time string comparison (`crypto.timingSafeEqual`) for OTP and payment webhook signatures.
   - NextAuth session tokens secured with `httpOnly`, `sameSite`, and `secure` cookies in production.
   - Rate limiting on login, registration, password reset, and OTP generation endpoints.

2. **Web Security & Headers**:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
   - `poweredByHeader: false` (removes Next.js signature)

3. **CORS**:
   - Explicit trusted origin allowlist in `backend/src/lib/cors.ts`. Untrusted origins do not receive credentialed reflection.

4. **File Uploads**:
   - Size limit: 10MB maximum.
   - Allowed MIME types strictly allowlisted (JPEG, PNG, WEBP, GIF, PDF, MP4).
   - Magic number byte verification validates raw file headers against declared MIME types.
   - Strict canonical path resolution and sandbox CSP prevents path traversal and stored XSS.

## Development Setup

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Environment configuration**:
   - Copy `backend/.env.example` to `backend/.env` and provide real credentials.
   - Copy `frontend/.env.example` to `frontend/.env`.

3. **Start development servers**:
   - Frontend: `npm run dev:frontend` (http://localhost:3000)
   - Backend: `npm run dev:backend` (http://localhost:5000)

## Production Deployment & Verification

Run the automated production deployment script:
```bash
bash scripts/production-deploy.sh
# or
bash scripts/deploy-prod.sh
```

Or run the development deployment script:
```bash
bash scripts/deploy-dev.sh
```

Or verify builds manually:
```bash
# Type checks
node backend/node_modules/typescript/bin/tsc -p backend/tsconfig.json --noEmit
node frontend/node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit

# Production dependency audit
npm audit --prefix backend --omit=dev
npm audit --prefix frontend --omit=dev

# Production build
npm run build:backend
npm run build:frontend
```
