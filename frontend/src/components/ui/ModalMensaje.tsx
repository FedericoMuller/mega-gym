interface Props {
  mensaje: string;
  onAceptar: () => void;
  titulo?: string;
}

export function ModalMensaje({ mensaje, onAceptar, titulo = "Aviso" }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-sm rounded-lg bg-brand-surface p-6 text-center shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-white">{titulo}</h2>
        <p className="mb-6 text-sm text-white/70">{mensaje}</p>
        <button
          type="button"
          onClick={onAceptar}
          className="w-full rounded-lg bg-brand-accent py-2.5 font-semibold text-black"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
