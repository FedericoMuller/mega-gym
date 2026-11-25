import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { descargarCertificadoSocio } from "@/api/socios";
import { ModalMensaje } from "@/components/ui/ModalMensaje";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha de nacimiento cargada";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function PerfilPage() {
  const { usuario, actualizarPerfil } = useAuth();
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const [foto, setFoto] = useState<string | null>(() =>
    usuario ? localStorage.getItem(`foto_perfil_${usuario.id}`) : null
  );
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [descargandoCredencial, setDescargandoCredencial] = useState(false);
  const [errorCredencial, setErrorCredencial] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: usuario?.first_name ?? "",
    apellido: usuario?.apellido ?? "",
    fecha_nacimiento: usuario?.fecha_nacimiento ?? "",
  });

  if (!usuario) return null;

  function elegirFoto() {
    inputFotoRef.current?.click();
  }

  function onFotoSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo || !usuario) return;
    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = lector.result as string;
      setFoto(dataUrl);
      localStorage.setItem(`foto_perfil_${usuario.id}`, dataUrl);
    };
    lector.readAsDataURL(archivo);
  }

  function abrirEdicion() {
    if (!usuario) return;
    setForm({
      first_name: usuario.first_name,
      apellido: usuario.apellido,
      fecha_nacimiento: usuario.fecha_nacimiento ?? "",
    });
    setEditando(true);
  }

  async function descargarCredencial() {
    setDescargandoCredencial(true);
    try {
      const blob = await descargarCertificadoSocio();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "constancia_socio_club_rivadavia.pdf";
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorCredencial(
          "Su usuario no esta registrado como socio del club, por lo cual no es posible generar la constancia de socio activo"
        );
      } else if (err.response?.status === 403) {
        setErrorCredencial(
          "Su usuario esta registrado como socio inactivo del club, por lo cual no es posible generar la constancia de socio activo"
        );
      } else {
        setErrorCredencial("No se pudo generar la credencial. Intentá de nuevo más tarde.");
      }
    } finally {
      setDescargandoCredencial(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await actualizarPerfil(form);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-center text-lg font-bold">Perfil</h1>

      <div className="mb-6 flex flex-col items-center">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-brand-surface">
          {foto ? (
            <img src={foto} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-accent">
              {usuario.first_name?.[0]?.toUpperCase() ?? usuario.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={elegirFoto}
          className="mt-2 text-sm font-medium text-brand-accent"
        >
          Cambiar foto
        </button>
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFotoSeleccionada}
        />
      </div>

      {editando ? (
        <form onSubmit={guardar} className="mb-4 space-y-3">
          <CampoEditable
            valor={form.first_name}
            onChange={(v) => setForm({ ...form, first_name: v })}
            placeholder="Nombre"
          />
          <CampoEditable
            valor={form.apellido}
            onChange={(v) => setForm({ ...form, apellido: v })}
            placeholder="Apellido"
          />
          <div className="rounded-lg bg-brand-surface px-4 py-3 text-white/40">{usuario.dni}</div>
          <input
            type="date"
            value={form.fecha_nacimiento ?? ""}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
            className="w-full rounded-lg bg-brand-surface px-4 py-3 text-white outline-none ring-1 ring-transparent focus:ring-brand-accent"
          />
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-lg bg-brand-accent py-3 font-semibold text-black disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg px-4 py-3 text-sm text-white/60 hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg bg-brand-surface px-4 py-3">
            {usuario.first_name} {usuario.apellido}
          </div>
          <div className="rounded-lg bg-brand-surface px-4 py-3">{usuario.dni}</div>
          <div className="rounded-lg bg-brand-surface px-4 py-3">
            {formatearFecha(usuario.fecha_nacimiento)}
          </div>
        </div>
      )}

      {!editando && (
        <div className="space-y-3">
          {usuario.rol === "alumno" && (
            <button
              type="button"
              onClick={descargarCredencial}
              disabled={descargandoCredencial}
              className="block w-full rounded-lg bg-brand-accent py-3 text-center font-semibold text-black disabled:opacity-50"
            >
              {descargandoCredencial ? "Generando..." : "Mi credencial"}
            </button>
          )}
          <button
            type="button"
            onClick={abrirEdicion}
            className="w-full rounded-lg bg-brand-accent py-3 font-semibold text-black"
          >
            Editar datos
          </button>
        </div>
      )}

      {errorCredencial && (
        <ModalMensaje
          titulo="Credencial"
          mensaje={errorCredencial}
          onAceptar={() => setErrorCredencial(null)}
        />
      )}
    </div>
  );
}

function CampoEditable({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg bg-brand-surface px-4 py-3 text-white outline-none ring-1 ring-transparent focus:ring-brand-accent"
    />
  );
}
