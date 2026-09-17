import React, { useState } from 'react';
import { X, Search, ShieldCheck, Send, Clock, XCircle, Award } from 'lucide-react';
import { Instructor, JoinRequest } from '../types';

interface FindInstructorModalProps {
  instructors: Instructor[];
  myRequests: JoinRequest[];
  onClose: () => void;
  onSendRequest: (instructorId: string) => void | Promise<void>;
  onCancelRequest: (instructorId: string) => void;
}

export const FindInstructorModal: React.FC<FindInstructorModalProps> = ({
  instructors,
  myRequests,
  onClose,
  onSendRequest,
  onCancelRequest,
}) => {
  const [search, setSearch] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const filtered = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const requestFor = (instructorId: string) => myRequests.find((r) => r.instructorId === instructorId);

  const handleSend = async (instructorId: string) => {
    setSendingTo(instructorId);
    try {
      await onSendRequest(instructorId);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100/90 text-indigo-600 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Buscar um Professor</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Envie um pedido de vínculo — o professor precisa aceitar antes de acompanhar seu treino.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 sm:p-5 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou especialidade..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-2 space-y-2.5">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">Nenhum professor encontrado.</p>
          ) : (
            filtered.map((inst) => {
              const req = requestFor(inst.id);
              return (
                <div
                  key={inst.id}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3"
                >
                  <img
                    src={inst.avatar}
                    alt={inst.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{inst.name}</h4>
                    <p className="text-[11px] text-indigo-600 font-medium truncate">{inst.specialty}</p>
                    {inst.cref && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Award className="w-2.5 h-2.5" /> CREF {inst.cref}
                      </p>
                    )}
                  </div>

                  {req?.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => onCancelRequest(inst.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition cursor-pointer"
                    >
                      <Clock className="w-3 h-3" /> Aguardando — Cancelar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSend(inst.id)}
                      disabled={sendingTo === inst.id}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-60"
                    >
                      <Send className="w-3 h-3" />
                      {sendingTo === inst.id ? 'Enviando...' : req?.status === 'rejected' ? 'Pedir de novo' : 'Solicitar Vínculo'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
