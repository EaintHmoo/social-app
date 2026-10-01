Images, fonts and any other file imported by `src/` code (`import logo from "../assets/logo.svg"`).

Anything here is processed by Vite: it gets hashed, inlined if small, and fails the build if the
path is wrong. Files that must keep a fixed URL — favicon.svg, icons.svg, robots.txt — belong in
`public/` instead, which Vite copies verbatim.
