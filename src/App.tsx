import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import AuthPage from "./pages/AuthPage";
import CharacterCreatePage from "./pages/CharacterCreatePage";
import CharacterListPage from "./pages/CharacterListPage";
import CharacterSheetPage from "./pages/CharacterSheetPage";

function ProtectedRoute({ children }: { children: ReactElement }) {
	const { user, loading } = useAuth();
	if (loading) return <div className="muted center">Chargement…</div>;
	return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route path="/login" element={<AuthPage />} />
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<CharacterListPage />
							</ProtectedRoute>
						}
					/>
					<Route
            path="/characters/new"
            element={
              <ProtectedRoute>
                <CharacterCreatePage />
              </ProtectedRoute>
            }
          />
					<Route
						path="/characters/:id"
						element={
							<ProtectedRoute>
								<CharacterSheetPage />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}
