Custom hooks used by more than one feature (`useDebounce`, `useMediaQuery`, ...).

A hook that only one feature uses belongs in that feature instead — `features/auth/hooks/useAuth.ts`
is the current example. Move it up here the moment a second feature needs it.
