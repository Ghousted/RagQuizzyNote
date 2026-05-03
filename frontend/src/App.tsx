import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LandingPage } from "./app/routes/LandingPage";
import { LoginPage } from "./app/routes/LoginPage";
import { RegisterPage } from "./app/routes/RegisterPage";
import { DashboardPage } from "./app/routes/DashboardPage";
import { NotesPage } from "./app/routes/NotesPage";
import { NoteDetailPage } from "./app/routes/NoteDetailPage";
import { StudyPage } from "./app/routes/StudyPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/:id" element={<NoteDetailPage />} />
        <Route path="/study" element={<StudyPage />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#282828",
            color: "#cfcfcf",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "14px",
            borderRadius: "8px",
          },
          success: {
            iconTheme: {
              primary: "#4dab9a",
              secondary: "#282828",
            },
          },
          error: {
            iconTheme: {
              primary: "#e03e3e",
              secondary: "#282828",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}
