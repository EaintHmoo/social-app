Global client state, if this app ever needs a store (Redux Toolkit, Zustand).

It has none today, and that is deliberate: the only truly global state is the signed-in user,
which `features/auth` keeps in a React context, and everything else is server data each page
fetches for itself. Reach for a store when two distant parts of the tree must share state that
neither owns — not before.
