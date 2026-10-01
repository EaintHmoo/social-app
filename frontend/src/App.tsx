import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth";
import { AppRoutes } from "./routes";

/**
 * The app's outermost shell: router first, then the providers every route depends on.
 *
 * AuthProvider sits INSIDE BrowserRouter so anything in the auth tree is free to use navigation
 * hooks. The route table itself lives in routes/AppRoutes.tsx.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
