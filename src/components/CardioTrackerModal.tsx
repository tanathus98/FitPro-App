import React, { useState } from 'react';
import { 
  Flame, X, Activity, Timer, Zap, Footprints, Bike, TrendingUp, 
  Check, Trash2, Calendar, History, Info, ChevronRight, Sparkles, HeartPulse, Gauge
} from 'lucide-react';
import { CardioEquipment, CardioLog, Student } from '../types';
import { CARDIO_EQUIPMENTS, calculateCardioCalories, CardioEquipmentInfo } from '../utils/cardioCalculator';

interface CardioTrackerModalProps {
  student?: Student;
  cardioLogs: CardioLog[];
  onClose: () => void;
  onSaveCardioLog: (log: CardioLog) => void | Promise<void>;
  onDeleteCardioLog: (logId: string) => void;
}

export const CardioTrackerModal: React.FC<CardioTrackerModalProps> = ({
  student,
  cardioLogs = [],
  onClose,
  onSaveCardioLog,
  onDeleteCardioLog,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');

  // Form State
  const [selectedEquipment, setSelectedEquipment] = useState<CardioEquipment>('esteira');
  const equipmentConfig: CardioEquipmentInfo = CARDIO_EQUIPMENTS[selectedEquipment] || CARDIO_EQUIPMENTS.esteira;

  const [selectedIntensityId, setSelectedIntensityId] = useState<string>(
    equipmentConfig.intensities[1]?.id || equipmentConfig.intensities[0].id
  );
  const [durationMinutes, setDurationMinutes] = useState<number | string>(30);
  const [weightKg, setWeightKg] = useState<number | string>(student?.weightKg || 70);
  const [distanceKm, setDistanceKm] = useState<number | string>('');
  const [inclinePercent, setInclinePercent] = useState<number | string>('');
  const [avgHeartRateBpm, setAvgHeartRateBpm] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // When equipment changes, reset intensity to first of that equipment
  const handleEquipmentChange = (eq: CardioEquipment) => {
    setSelectedEquipment(eq);
    const newConfig = CARDIO_EQUIPMENTS[eq];
    if (newConfig && newConfig.intensities.length > 0) {
      setSelectedIntensityId(newConfig.intensities[0].id);
    }
  };

  // Find active intensity option
  const activeIntensity = equipmentConfig.intensities.find((i) => i.id === selectedIntensityId) || equipmentConfig.intensities[0];

  // Numeric values
  const numDuration = Math.max(1, parseFloat(String(durationMinutes)) || 0);
  const numWeight = Math.max(30, parseFloat(String(weightKg)) || (student?.weightKg || 70));
  const numDistance = parseFloat(String(distanceKm)) || undefined;
  const numIncline = parseFloat(String(inclinePercent)) || undefined;
  const numBpm = parseFloat(String(avgHeartRateBpm)) || undefined;

  // Calculation
  const result = calculateCardioCalories({
    met: activeIntensity.met,
    durationMinutes: numDuration,
    weightKg: numWeight,
    distanceKm: numDistance,
  });

  // Filter logs for this student if student is provided
  const studentLogs = student
    ? cardioLogs.filter((l) => l.studentId === student.id)
    : cardioLogs;

  // Aggregate stats
  const totalCalories = studentLogs.reduce((acc, log) => acc + (log.caloriesBurned || 0), 0);
  const totalMinutes = studentLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
  const totalDistance = studentLogs.reduce((acc, log) => acc + (log.distanceKm || 0), 0);

  // Handle Save
  const handleSave = async () => {
    if (!student || isSaving) return;

    const newLog: CardioLog = {
      id: `cardio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      studentName: student.name,
      date: dateStr,
      equipment: selectedEquipment,
      equipmentLabel: equipmentConfig.name,
      intensityLevel: activeIntensity.level,
      intensityLabel: activeIntensity.label,
      durationMinutes: numDuration,
      weightKg: numWeight,
      caloriesBurned: result.caloriesBurned,
      distanceKm: numDistance,
      inclinePercent: numIncline,
      avgHeartRateBpm: numBpm,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setSaveError(null);
    setIsSaving(true);
    try {
      // Aguarda a gravação real no Firestore antes de comemorar — se a
      // escrita falhar (ex: regra de permissão), o erro cai no catch e o
      // usuário é avisado, em vez de ver "sucesso" para um dado que não
      // foi salvo.
      await onSaveCardioLog(newLog);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('history');
      }, 1200);
    } catch (err) {
      console.error('Falha ao salvar registro de cardio:', err);
      setSaveError('Não foi possível salvar este registro. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for equipment icon
  const renderEquipmentIcon = (eq: CardioEquipment, className = 'w-4 h-4') => {
    switch (eq) {
      case 'esteira':
        return <Footprints className={className} />;
      case 'bike':
        return <Bike className={className} />;
      case 'escada':
        return <TrendingUp className={className} />;
      case 'remo':
        return <Zap className={className} />;
      case 'corda':
        return <Flame className={className} />;
      case 'eliptico':
      default:
        return <Activity className={className} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="cardio-tracker-modal-container"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-100/90 text-orange-600 shadow-2xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Cardio & Gasto Calórico
                </h3>
                {student && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {student.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo de perda de calorias em esteira, bike, escada e registro de treinos
              </p>
            </div>
          </div>
          <button
            id="close-cardio-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 bg-white flex gap-2">
          <button
            id="tab-cardio-calc"
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'calculator'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Calculadora & Novo Registro</span>
          </button>

          <button
            id="tab-cardio-history"
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Sessões</span>
            {studentLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700">
                {studentLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'calculator' ? (
            <>
              {/* Equipment Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  1. Escolha o Equipamento / Modalidade
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(Object.keys(CARDIO_EQUIPMENTS) as CardioEquipment[]).map((key) => {
                    const item = CARDIO_EQUIPMENTS[key];
                    const isSelected = selectedEquipment === key;
                    return (
                      <button
                        key={key}
                        id={`cardio-equip-btn-${key}`}
                        type="button"
                        onClick={() => handleEquipmentChange(key)}
                        className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer min-h-[74px] ${
                          isSelected
                            ? 'bg-orange-50/80 border-orange-500 text-orange-700 shadow-2xs font-bold ring-2 ring-orange-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {renderEquipmentIcon(key, 'w-4 h-4')}
                        </div>
                        <span className="text-[11px] leading-tight line-clamp-1">
                          {item.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Ritmo & Intensidade
                  </label>
                  <span className="text-[11px] text-slate-500">
                    MET atual: <strong className="text-orange-600 font-mono font-bold">{activeIntensity.met}</strong>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {equipmentConfig.intensities.map((intensity) => {
                    const isSelected = selectedIntensityId === intensity.id;
                    return (
                      <div
                        key={intensity.id}
                        id={`cardio-intensity-${intensity.id}`}
                        onClick={() => setSelectedIntensityId(intensity.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-orange-50/80 border-orange-400 text-slate-900 shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="cardio-intensity"
                            checked={isSelected}
                            onChange={() => setSelectedIntensityId(intensity.id)}
                            className="text-orange-600 focus:ring-orange-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">
                              {intensity.label}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {intensity.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            intensity.level === 'hiit'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : intensity.level === 'vigorosa'
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : intensity.level === 'moderada'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {intensity.level}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Workout Duration & Parameters Grid */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Parâmetros da Sessão
                  </span>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1">
                    {[15, 20, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          numDuration === mins
                            ? 'bg-orange-500 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Duration */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Tempo (minutos)
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500">
                      <Timer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        id="cardio-input-duration"
                        type="number"
                        min="1"
                        max="300"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-400 font-semibold">min</span>
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Peso Atual (kg)
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500">
                      <input
                        id="cardio-input-weight"
                        type="number"
                        step="0.5"
                        min="30"
                        max="250"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-400 font-semibold">kg</span>
                    </div>
                  </div>

                  {/* Distance (Optional) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Distância (opcional)
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500">
                      <input
                        id="cardio-input-distance"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Ex: 4.2"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-400 font-semibold">km</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Data da Atividade
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        id="cardio-input-date"
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-900 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Specific inputs: Incline for treadmill or notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                  {selectedEquipment === 'esteira' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Inclinação da Esteira (%)
                      </label>
                      <input
                        id="cardio-input-incline"
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        placeholder="Ex: 3.0"
                        value={inclinePercent}
                        onChange={(e) => setInclinePercent(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Frequência Cardíaca Média (bpm)
                    </label>
                    <input
                      id="cardio-input-bpm"
                      type="number"
                      min="60"
                      max="220"
                      placeholder="Ex: 145"
                      value={avgHeartRateBpm}
                      onChange={(e) => setAvgHeartRateBpm(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className={selectedEquipment === 'esteira' ? 'sm:col-span-2' : ''}>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Observações / Anotações
                    </label>
                    <input
                      id="cardio-input-notes"
                      type="text"
                      placeholder="Ex: Pós-treino de musculação, em jejum, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Result Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50/50 to-white border border-orange-200/90 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-orange-200/60">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 block">
                      Gasto Calórico Estimado
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                        {result.caloriesBurned}
                      </span>
                      <span className="text-base font-extrabold text-orange-600">
                        kcal
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="bg-white/80 border border-orange-200/80 px-3 py-1.5 rounded-xl text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Gordura Oxidada
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                        ~{result.fatGramsBurned} g
                      </span>
                    </div>

                    <div className="bg-white/80 border border-orange-200/80 px-3 py-1.5 rounded-xl text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Gasto por minuto
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                        {result.caloriesPerMinute} kcal/min
                      </span>
                    </div>

                    {result.paceMinPerKm && (
                      <div className="bg-white/80 border border-orange-200/80 px-3 py-1.5 rounded-xl text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Pace Médio
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                          {result.paceMinPerKm}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Training Zone Info */}
                <div className="mt-3 flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${result.trainingZone.bgColor} ${result.trainingZone.color} border ${result.trainingZone.borderColor}`}>
                    <Gauge className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${result.trainingZone.color}`}>
                        {result.trainingZone.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      {result.trainingZone.description}
                    </p>
                  </div>
                </div>

                {/* Equipment Tip */}
                <div className="mt-3 pt-3 border-t border-orange-200/50 flex items-start gap-2 text-slate-600 text-xs">
                  <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Dica de Postura & Eficiência ({equipmentConfig.name}):</strong> {equipmentConfig.tips}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Tab 2: Cardio History */
            <div className="space-y-4">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Calorias Gastas
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                      {totalCalories}
                    </span>
                    <span className="text-xs font-bold text-orange-600">kcal</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Tempo Acumulado
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                      {totalMinutes}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">min</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total de Sessões
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                      {studentLogs.length}
                    </span>
                    <span className="text-xs font-bold text-slate-500">treinos</span>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              {studentLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <Flame className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nenhum treino de cardio registrado para este aluno ainda.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Utilize a aba "Calculadora & Novo Registro" acima para calcular e salvar a primeira sessão!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentLogs
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((log) => (
                      <div
                        key={log.id}
                        id={`cardio-log-item-${log.id}`}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 hover:border-slate-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 shrink-0 mt-0.5">
                            {renderEquipmentIcon(log.equipment, 'w-4 h-4')}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-900">
                                {log.equipmentLabel}
                              </h5>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                                {new Date(log.date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-orange-100/70 text-orange-700 font-bold">
                                {log.intensityLabel}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-slate-500 mt-1">
                              <span>Duração: <strong className="text-slate-800">{log.durationMinutes} min</strong></span>
                              <span>•</span>
                              <span>Peso: <strong className="text-slate-800">{log.weightKg} kg</strong></span>
                              {log.distanceKm && (
                                <>
                                  <span>•</span>
                                  <span>Distância: <strong className="text-slate-800">{log.distanceKm} km</strong></span>
                                </>
                              )}
                              {log.inclinePercent && (
                                <>
                                  <span>•</span>
                                  <span>Inclinação: <strong className="text-slate-800">{log.inclinePercent}%</strong></span>
                                </>
                              )}
                              {log.avgHeartRateBpm && (
                                <>
                                  <span>•</span>
                                  <span>BPM: <strong className="text-slate-800">{log.avgHeartRateBpm}</strong></span>
                                </>
                              )}
                            </div>

                            {log.notes && (
                              <p className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 mt-2">
                                "{log.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-lg font-black text-slate-900 font-mono block leading-none">
                              {log.caloriesBurned} <span className="text-xs font-bold text-orange-600">kcal</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              ~{Math.round((log.caloriesBurned / 7.7) * 10) / 10}g gordura
                            </span>
                          </div>

                          <button
                            id={`delete-cardio-btn-${log.id}`}
                            type="button"
                            onClick={() => onDeleteCardioLog(log.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Excluir este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {activeTab === 'calculator' && student ? (
            <div className="flex flex-col gap-1.5">
              <button
                id="save-cardio-log-btn"
                type="button"
                onClick={handleSave}
                disabled={saveSuccess || isSaving}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200 disabled:opacity-60'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Cardio Registrado com Sucesso!</span>
                  </>
                ) : isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>Salvar {result.caloriesBurned} kcal no Perfil ({student.name.split(' ')[0]})</span>
                  </>
                )}
              </button>
              {saveError && (
                <span className="text-[11px] font-semibold text-rose-600">{saveError}</span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium">
              {activeTab === 'calculator'
                ? 'Ajuste os parâmetros para calcular o gasto calórico instantâneo.'
                : `${studentLogs.length} sessões registradas no histórico.`}
            </div>
          )}

          <button
            id="close-cardio-footer-btn"
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
