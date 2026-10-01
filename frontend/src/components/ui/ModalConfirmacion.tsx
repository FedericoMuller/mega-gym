import { TriangleAlert } from "lucide-react";

interface Props {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  cargando?: boolean;
  error?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacion({
  titulo,
  mensaje,
  textoConfirmar = "Eliminar",
  cargando = false,
  error,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-sm rounded-xl bg-brand-surface p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <TriangleAlert size={24} />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white">{titulo}</h2>
        <p className="mb-5 text-sm text-white/70">{mensaje}</p>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 rounded-lg bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {cargando ? "Eliminando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
