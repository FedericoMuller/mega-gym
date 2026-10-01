import { NavLink, Outlet } from "react-router-dom";
import {
  ClipboardList,
  Dumbbell,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ItemNav {
  to: string;
  label: string;
  icono: LucideIcon;
}

const navAlumno: ItemNav[] = [
  { to: "/rutinas", label: "Rutinas", icono: ClipboardList },
  { to: "/seguimiento", label: "Seguimiento", icono: TrendingUp },
  { to: "/perfil", label: "Perfil", icono: User },
];

// Ítems base que ve cualquier profesor
const navProfesorBase: ItemNav[] = [
  { to: "/admin/alumnos", label: "Alumnos", icono: Users },
  { to: "/admin/rutinas", label: "Rutinas", icono: ClipboardList },
  { to: "/admin/ejercicios", label: "Ejercicios", icono: Dumbbell },
  { to: "/admin/maquinas", label: "Máquinas", icono: Settings },
  { to: "/perfil", label: "Perfil", icono: User },
];

// Ítem extra que solo ve el super admin
const itemProfesores: ItemNav = { to: "/admin/profesores", label: "Profesores", icono: ShieldCheck };

export function Layout() {
  const { usuario, salir } = useAuth();

  let items: ItemNav[];
  if (usuario?.rol === "profesor") {
    items = usuario.is_superuser
      ? [...navProfesorBase, itemProfesores] // super admin: base + "Profesores"
      : navProfesorBase;                      // profesor común: solo base
  } else {
    items = navAlumno;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar en desktop (md+), oculto en mobile */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-white/10 md:bg-brand-surface md:p-4">
        <div className="mb-8 flex items-center justify-center gap-3 py-2">
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-lg" />
          <span className="whitespace-nowrap text-[27px] font-bold leading-none">Mega Gym</span>
        </div>
        <nav className="flex flex-col gap-[5px]">
          {items.map((item) => {
            const Icono = item.icono;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-[15px] rounded-lg border px-[15px] py-[10px] text-[17.5px] transition-colors ${
                    isActive
                      ? "border-brand-accent/60 bg-brand-accent/10 font-medium text-brand-accent"
                      : "border-transparent text-white/70 hover:bg-white/5"
                  }`
                }
              >
                <Icono size={22} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <button
          onClick={salir}
          className="mt-auto rounded-lg px-[15px] py-[10px] text-left text-[17.5px] text-white/50 hover:bg-white/5"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Header mobile */}
      <header className="flex items-center justify-between border-b border-white/10 bg-brand-surface px-4 py-3 md:hidden">
        <span className="font-semibold">
          Hola, <span className="text-brand-accent">{usuario?.first_name || usuario?.username}</span>
        </span>
        <button onClick={salir} aria-label="Cerrar sesión" className="text-white/60">
          <LogOut size={20} />
        </button>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
        <Outlet />
      </main>

      {/* Bottom nav en mobile, oculto en desktop */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-white/10 bg-brand-surface py-2 md:hidden">
        {items.map((item) => {
          const Icono = item.icono;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 text-xs ${
                  isActive ? "text-brand-accent" : "text-white/50"
                }`
              }
            >
              <Icono size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}