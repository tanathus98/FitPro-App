import React, { useState } from 'react';
import {
  Scale, X, Check, History, Ruler, TrendingDown, TrendingUp, Minus,
  Trash2, Info,
} from 'lucide-react';
import { BodyMeasurement, Student } from '../types';

interface MeasurementsModalProps {
  student?: Student;
  measurements: BodyMeasurement[];
  onClose: () => void;
  onSaveMeasurement: (measurement: BodyMeasurement) => void | Promise<void>;
  onDeleteMeasurement: (measurementId: string) => void;
}

const todayStr = () => new Date().toISOString().split('T')[0];

const formatDatePtBR = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// Seta de tendência comparando com o registro anterior (menor não é sempre
// "melhor" — depende do objetivo do aluno — por isso mostramos só a
// variação numérica, sem cor de "certo/errado".
const Delta: React.FC<{ current?: number; previous?: number; unit: string }> = ({
  current,
  previous,
  unit,
}) => {
  if (current === undefined || previous === undefined) return null;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
        <Minus className="w-2.5 h-2.5" /> estável
      </span>
    );
  }
  const isUp = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
        isUp ? 'text-orange-600' : 'text-indigo-600'
      }`}
    >
      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {isUp ? '+' : ''}
      {diff}
      {unit}
    </span>
  );
};

export const MeasurementsModal: React.FC<MeasurementsModalProps> = ({
  student,
  measurements = [],
  onClose,
  onSaveMeasurement,
  onDeleteMeasurement,
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [showExtras, setShowExtras] = useState(false);

  const studentMeasurements = (student
    ? measurements.filter((m) => m.studentId === student.id)
    : measurements
  ).sort((a, b) => (a.dateStr < b.dateStr ? 1 : -1));

  const lastMeasurement = studentMeasurements[0];

  const [dateStr, setDateStr] = useState<string>(todayStr());
  const [weightKg, setWeightKg] = useState<number | string>(
    lastMeasurement?.weightKg ?? student?.weightKg ?? ''
  );
  const [bodyFatPercent, setBodyFatPercent] = useState<number | string>(
    lastMeasurement?.bodyFatPercent ?? ''
  );
  const [waistCm, setWaistCm] = useState<number | string>('');
  const [hipCm, setHipCm] = useState<number | string>('');
  const [chestCm, setChestCm] = useState<number | string>('');
  const [armCm, setArmCm] = useState<number | string>('');
  const [thighCm, setThighCm] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const numWeight = parseFloat(String(weightKg)) || undefined;
  const numBodyFat = bodyFatPercent !== '' ? parseFloat(String(bodyFatPercent)) : undefined;
  const fatMassKg =
    numWeight && numBodyFat !== undefined
      ? Math.round(((numWeight * numBodyFat) / 100) * 10) / 10
      : undefined;
  const leanMassKg =
    numWeight && fatMassKg !== undefined ? Math.round((numWeight - fatMassKg) * 10) / 10 : undefined;

  const handleSave = async () => {
    if (!student || isSaving) return;
    if (!numWeight) {
      setSaveError('Informe ao menos o peso para salvar o registro.');
      return;
    }

    const measurement: BodyMeasurement = {
      id: dateStr,
      studentId: student.id,
      studentName: student.name,
      dateStr,
      weightKg: numWeight,
      heightCm: student.heightCm,
      bodyFatPercent: numBodyFat,
      leanMassKg,
      fatMassKg,
      waistCm: parseFloat(String(waistCm)) || undefined,
      hipCm: parseFloat(String(hipCm)) || undefined,
      chestCm: parseFloat(String(chestCm)) || undefined,
      armCm: parseFloat(String(armCm)) || undefined,
      thighCm: parseFloat(String(thighCm)) || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setSaveError(null);
    setIsSaving(true);
    try {
      await onSaveMeasurement(measurement);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('history');
      }, 1200);
    } catch (err) {
      console.error('Falha ao salvar medidas:', err);
      setSaveError('Não foi possível salvar este registro. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="measurements-modal-container"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100/90 text-indigo-600 shadow-2xs">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Medidas Corporais
                </h3>
                {student && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {student.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Peso, % de gordura, massa magra/gorda e evolução ao longo do tempo
              </p>
            </div>
          </div>
          <button
            id="close-measurements-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 bg-white flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'new'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> Novo Registro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Histórico ({studentMeasurements.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'new' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    max={todayStr()}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="Ex: 78.5"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    % de Gordura (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFatPercent}
                    onChange={(e) => setBodyFatPercent(e.target.value)}
                    placeholder="Ex: 18.5 (bioimpedância/adipômetro)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Resultado: massa magra / gorda */}
              {numWeight && (
                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Peso</span>
                    <span className="text-lg font-black text-slate-900">{numWeight} kg</span>
                    <Delta current={numWeight} previous={lastMeasurement?.weightKg} unit="kg" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Massa Magra</span>
                    <span className="text-lg font-black text-indigo-700">
                      {leanMassKg !== undefined ? `${leanMassKg} kg` : '—'}
                    </span>
                    {leanMassKg !== undefined && (
                      <Delta current={leanMassKg} previous={lastMeasurement?.leanMassKg} unit="kg" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Massa Gorda</span>
                    <span className="text-lg font-black text-orange-600">
                      {fatMassKg !== undefined ? `${fatMassKg} kg` : '—'}
                    </span>
                    {fatMassKg !== undefined && (
                      <Delta current={fatMassKg} previous={lastMeasurement?.fatMassKg} unit="kg" />
                    )}
                  </div>
                </div>
              )}

              {numBodyFat === undefined && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    Sem o % de gordura (bioimpedância, adipômetro ou estimativa visual), só o peso é
                    registrado — massa magra/gorda ficam em branco.
                  </span>
                </div>
              )}

              {/* Medidas complementares (opcional) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowExtras((v) => !v)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer"
                >
                  <span>Circunferências (opcional)</span>
                  <span className="text-slate-400 normal-case font-medium">{showExtras ? 'ocultar' : 'mostrar'}</span>
                </button>
                {showExtras && (
                  <div className="p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Cintura (cm)', value: waistCm, set: setWaistCm },
                      { label: 'Quadril (cm)', value: hipCm, set: setHipCm },
                      { label: 'Peito (cm)', value: chestCm, set: setChestCm },
                      { label: 'Braço (cm)', value: armCm, set: setArmCm },
                      { label: 'Coxa (cm)', value: thighCm, set: setThighCm },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          {field.label}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={field.value}
                          onChange={(e) => field.set(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: método de avaliação, condição do dia, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              {studentMeasurements.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <Ruler className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nenhuma medida registrada para este aluno ainda.
                  </p>
                </div>
              ) : (
                studentMeasurements.map((m, idx) => {
                  const previous = studentMeasurements[idx + 1];
                  return (
                    <div
                      key={m.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-bold text-slate-900">{formatDatePtBR(m.dateStr)}</h5>
                          {m.weightKg && (
                            <span className="text-[11px] font-semibold text-slate-700">
                              {m.weightKg} kg <Delta current={m.weightKg} previous={previous?.weightKg} unit="kg" />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 mt-1">
                          {m.bodyFatPercent !== undefined && <span>Gordura: <strong className="text-slate-800">{m.bodyFatPercent}%</strong></span>}
                          {m.leanMassKg !== undefined && <span>Massa Magra: <strong className="text-indigo-700">{m.leanMassKg}kg</strong></span>}
                          {m.fatMassKg !== undefined && <span>Massa Gorda: <strong className="text-orange-600">{m.fatMassKg}kg</strong></span>}
                        </div>
                        {(m.waistCm || m.hipCm || m.chestCm || m.armCm || m.thighCm) && (
                          <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400 mt-1">
                            {m.waistCm && <span>Cintura: {m.waistCm}cm</span>}
                            {m.hipCm && <span>Quadril: {m.hipCm}cm</span>}
                            {m.chestCm && <span>Peito: {m.chestCm}cm</span>}
                            {m.armCm && <span>Braço: {m.armCm}cm</span>}
                            {m.thighCm && <span>Coxa: {m.thighCm}cm</span>}
                          </div>
                        )}
                        {m.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 mt-2">
                            "{m.notes}"
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteMeasurement(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer self-end sm:self-center shrink-0"
                        title="Excluir este registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {activeTab === 'new' && student ? (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saveSuccess || isSaving}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 disabled:opacity-60'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Registro Salvo com Sucesso!</span>
                  </>
                ) : isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>Salvar Medidas de {formatDatePtBR(dateStr)}</span>
                  </>
                )}
              </button>
              {saveError && <span className="text-[11px] font-semibold text-rose-600">{saveError}</span>}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium">
              {activeTab === 'new'
                ? 'Preencha ao menos o peso para registrar.'
                : `${studentMeasurements.length} registros no histórico.`}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
