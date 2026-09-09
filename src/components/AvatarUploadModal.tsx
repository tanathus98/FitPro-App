import React, { useRef, useState } from 'react';
import { X, Camera, Upload, Loader2 } from 'lucide-react';

interface AvatarUploadModalProps {
  currentAvatar?: string;
  name: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

// Redimensiona e comprime a imagem no navegador (canvas) antes de salvar,
// para caber com folga no limite de tamanho de um documento do Firestore
// (a imagem final fica com poucos KBs, bem abaixo do limite de 1MB).
function resizeImageToDataUrl(file: File, maxSize = 320, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        // Recorte central quadrado
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao processar imagem.'));
          return;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  currentAvatar,
  name,
  onClose,
  onSave,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem (JPG, PNG, etc).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem é muito grande. Escolha um arquivo de até 10MB.');
      return;
    }

    setError('');
    setIsProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPreview(dataUrl);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível processar essa imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (preview) {
      onSave(preview);
      onClose();
    }
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="avatar-upload-modal"
        className="relative w-full max-w-xs bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Foto de Perfil</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-100 flex items-center justify-center">
            {displayImage ? (
              <img src={displayImage} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-10 h-10 text-slate-400" />
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-rose-600 text-center font-medium">{error}</p>
          )}

          <input
            ref={fileInputRef}
            id="avatar-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            id="btn-choose-avatar-file"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Escolher Foto do Dispositivo
          </button>

          <button
            type="button"
            id="btn-save-avatar"
            onClick={handleSave}
            disabled={!preview || isProcessing}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition cursor-pointer"
          >
            Salvar Foto
          </button>
        </div>
      </div>
    </div>
  );
};
