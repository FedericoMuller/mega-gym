import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { actualizarMiPerfil, loginAlumno, loginProfesor, obtenerPerfil, Usuario } from "@/api/auth";

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  ingresarComoAlumno: (dni: string) => Promise<void>;
  ingresarComoProfesor: (username: string, password: string) => Promise<void>;
  actualizarPerfil: (
    datos: Partial<Pick<Usuario, "first_name" | "apellido" | "fecha_nacimiento">>
  ) => Promise<void>;
  salir: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setCargando(false);
      return;
    }
    obtenerPerfil()
      .then(setUsuario)
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setCargando(false));
  }, []);

  async function ingresarComoAlumno(dni: string) {
    const { access, refresh, usuario } = await loginAlumno(dni);
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    setUsuario(usuario);
  }

  async function ingresarComoProfesor(username: string, password: string) {
    const { access, refresh } = await loginProfesor(username, password);
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const perfil = await obtenerPerfil();
    setUsuario(perfil);
  }

  function salir() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUsuario(null);
  }

  async function actualizarPerfil(
    datos: Partial<Pick<Usuario, "first_name" | "apellido" | "fecha_nacimiento">>
  ) {
    if (!usuario) return;
    const actualizado = await actualizarMiPerfil(usuario.id, datos);
    setUsuario(actualizado);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        ingresarComoAlumno,
        ingresarComoProfesor,
        actualizarPerfil,
        salir,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
