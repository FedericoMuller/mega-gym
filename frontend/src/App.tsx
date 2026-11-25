import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { RutaProtegida } from "@/routes/RutaProtegida";
import { Layout } from "@/components/layout/Layout";

import { LoginPage } from "@/pages/auth/LoginPage";
import { PerfilPage } from "@/pages/PerfilPage";

import { RutinasPage } from "@/pages/alumno/RutinasPage";
import { DetalleEjercicioPage } from "@/pages/alumno/DetalleEjercicioPage";
import { SeguimientoPage } from "@/pages/alumno/SeguimientoPage";

import { AlumnosAdminPage } from "@/pages/profesor/AlumnosAdminPage";
import { RutinasAdminPage } from "@/pages/profesor/RutinasAdminPage";
import { EjerciciosAdminPage } from "@/pages/profesor/EjerciciosAdminPage";
import { MaquinasAdminPage } from "@/pages/profesor/MaquinasAdminPage";
import { ProfesoresAdminPage } from "@/pages/profesor/ProfesoresAdminPage";
import { SociosAdminPage } from "@/pages/profesor/SociosAdminPage";

function InicioRedirect() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return (
    <Navigate to={usuario.rol === "profesor" ? "/admin/alumnos" : "/rutinas"} replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route path="/" element={<InicioRedirect />} />
        <Route path="/perfil" element={<PerfilPage />} />

        {/* --- Vistas Alumno --- */}
        <Route
          path="/rutinas"
          element={
            <RutaProtegida rolRequerido="alumno">
              <RutinasPage />
            </RutaProtegida>
          }
        />
        <Route
          path="/rutinas/ejercicio/:id"
          element={
            <RutaProtegida rolRequerido="alumno">
              <DetalleEjercicioPage />
            </RutaProtegida>
          }
        />
        <Route
          path="/seguimiento"
          element={
            <RutaProtegida rolRequerido="alumno">
              <SeguimientoPage />
            </RutaProtegida>
          }
        />

        {/* --- Vistas Profesor --- */}
        <Route
          path="/admin/alumnos"
          element={
            <RutaProtegida rolRequerido="profesor">
              <AlumnosAdminPage />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/rutinas"
          element={
            <RutaProtegida rolRequerido="profesor">
              <RutinasAdminPage />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/ejercicios"
          element={
            <RutaProtegida rolRequerido="profesor">
              <EjerciciosAdminPage />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/maquinas"
          element={
            <RutaProtegida rolRequerido="profesor">
              <MaquinasAdminPage />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/socios"
          element={
            <RutaProtegida rolRequerido="profesor">
              <SociosAdminPage />
            </RutaProtegida>
          }
        />

        {/* --- Vista exclusiva del super admin --- */}
        <Route
          path="/admin/profesores"
          element={
            <RutaProtegida rolRequerido="profesor" soloSuperAdmin>
              <ProfesoresAdminPage />
            </RutaProtegida>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}