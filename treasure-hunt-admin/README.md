# Treasure Hunt Admin

Admin console for the Online Treasure Hunt platform.

## Scripts

- `npm run dev` - start development server
- `npm run build` - build production bundle
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Auth Flow

- Root route (`/`) redirects to:
  - `/dashboard` when `adminToken` is present
  - `/login` when token is missing
