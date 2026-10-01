import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ModalMensaje } from "@/components/ui/ModalMensaje";

export function LoginPage() {
  const [modo, setModo] = useState<"alumno" | "profesor">("alumno");
  const [dni, setDni] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { ingresarComoAlumno, ingresarComoProfesor } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      if (modo === "alumno") {
        await ingresarComoAlumno(dni);
        navigate("/rutinas");
      } else {
        await ingresarComoProfesor(username, password);
        navigate("/admin/alumnos");
      }
    } catch (err: any) {
      // Mapea los mensajes de error del backend (ver CU13 flujo de excepción)
      setError(
        err?.response?.data?.detail ||
          "No se pudo iniciar sesión. Verifique los datos ingresados."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <img src="/icons/icon-192.png" alt="" className="mx-auto mb-2 h-16 w-16 rounded-2xl" />
        <h1 className="text-2xl font-bold">Mega Gym</h1>
      </div>

      <div className="mb-6 flex rounded-lg bg-brand-surface p-1">
        <button
          className={`rounded-md px-4 py-1.5 text-sm ${
            modo === "alumno" ? "bg-brand-accent text-black" : "text-white/60"
          }`}
          onClick={() => setModo("alumno")}
          type="button"
        >
          Soy alumno
        </button>
        <button
          className={`rounded-md px-4 py-1.5 text-sm ${
            modo === "profesor" ? "bg-brand-accent text-black" : "text-white/60"
          }`}
          onClick={() => setModo("profesor")}
          type="button"
        >
          Soy profesor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {modo === "alumno" ? (
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ingrese su DNI o credencial de socio"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full rounded-lg bg-brand-surface px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand-accent"
            required
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-brand-surface px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand-accent"
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-brand-surface px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand-accent"
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-brand-accent py-3 font-semibold text-black transition-opacity disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {error && (
        <ModalMensaje
          titulo="No se pudo iniciar sesión"
          mensaje={error}
          onAceptar={() => setError("")}
        />
      )}
    </div>
  );
}
