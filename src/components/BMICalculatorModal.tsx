import React, { useState, useEffect } from 'react';
import { Scale, X, Info, Activity, ArrowRight, Check, HeartPulse } from 'lucide-react';

interface BMICalculatorModalProps {
  initialWeight?: number;
  initialHeight?: number;
  studentName?: string;
  onClose: () => void;
  onSaveToStudent?: (weightKg: number, heightCm: number) => void;
}

export interface BMICategory {
  label: string;
  range: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) {
    return {
      label: 'Abaixo do peso',
      range: '< 18.5',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      description: 'Pode indicar ingestão calórica insuficiente ou metabolismo acelerado. Recomendado acompanhamento nutricional para ganho de massa magra.',
    };
  }
  if (bmi >= 18.5 && bmi < 24.9) {
    return {
      label: 'Peso ideal / Normal',
      range: '18.5 - 24.9',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-800',
      description: 'Faixa de peso considerada saudável pela OMS. Mantenha os treinos regulares e alimentação equilibrada.',
    };
  }
  if (bmi >= 25 && bmi < 29.9) {
    return {
      label: 'Sobrepeso',
      range: '25.0 - 29.9',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      description: 'Atenção para praticantes de musculação: o IMC não diferencia massa magra (músculos) de gordura corporal. Em atletas, IMC elevado pode refletir hipertrofia.',
    };
  }
  if (bmi >= 30 && bmi < 34.9) {
    return {
      label: 'Obesidade Grau I',
      range: '30.0 - 34.9',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-800',
      description: 'Foco prioritário em reeducação alimentar, treinos de resistência muscular combinados com aeróbios para saúde cardiovascular.',
    };
  }
  if (bmi >= 35 && bmi < 39.9) {
    return {
      label: 'Obesidade Grau II',
      range: '35.0 - 39.9',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      description: 'Risco moderado a elevado de alterações metabólicas (pressão arterial, glicemia). Acompanhamento multiprofissional indicado.',
    };
  }
  return {
    label: 'Obesidade Grau III',
    range: '≥ 40.0',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    description: 'Requer atenção médica e plano de treino com proteção articular e progressão gradual de intensidade.',
  };
};

export const BMICalculatorModal: React.FC<BMICalculatorModalProps> = ({
  initialWeight = 70,
  initialHeight = 175,
  studentName,
  onClose,
  onSaveToStudent,
}) => {
  const [weight, setWeight] = useState<number | string>(initialWeight || 70);
  const [height, setHeight] = useState<number | string>(initialHeight || 175);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Parse numeric values
  const numWeight = parseFloat(String(weight)) || 0;
  const numHeight = parseFloat(String(height)) || 0;

  // Calculate BMI: weight / (heightInMeters ^ 2)
  const heightInMeters = numHeight > 0 ? numHeight / 100 : 0;
  const bmiValue = heightInMeters > 0 && numWeight > 0 ? numWeight / (heightInMeters * heightInMeters) : 0;
  const roundedBmi = bmiValue > 0 ? Math.round(bmiValue * 10) / 10 : 0;
  const category = getBMICategory(roundedBmi);

  // Ideal weight range for this height (BMI 18.5 to 24.9)
  const minIdealWeight = heightInMeters > 0 ? Math.round(18.5 * heightInMeters * heightInMeters * 10) / 10 : 0;
  const maxIdealWeight = heightInMeters > 0 ? Math.round(24.9 * heightInMeters * heightInMeters * 10) / 10 : 0;

  // Handle save
  const handleSave = () => {
    if (onSaveToStudent && numWeight > 0 && numHeight > 0) {
      onSaveToStudent(numWeight, numHeight);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="bmi-calculator-modal-container"
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100/80 text-indigo-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Calculadora de IMC
              </h3>
              <p className="text-xs text-slate-500">
                {studentName ? `Índice de Massa Corporal • ${studentName}` : 'Classificação e Peso Ideal OMS'}
              </p>
            </div>
          </div>
          <button
            id="close-bmi-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Inputs Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Peso Atual (kg)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="bmi-input-weight"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Altura (cm)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="bmi-input-height"
                  type="number"
                  step="1"
                  min="50"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-400">cm</span>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {roundedBmi > 0 ? (
            <div className={`p-4 sm:p-5 rounded-2xl border ${category.bgColor} ${category.borderColor} transition-all`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-black/5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Resultado do IMC
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                      {roundedBmi}
                    </span>
                    <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-white/80 border ${category.borderColor} ${category.color}`}>
                      {category.label}
                    </span>
                  </div>
                </div>

                {heightInMeters > 0 && (
                  <div className="sm:text-right bg-white/60 p-2.5 rounded-xl border border-black/5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Faixa de Peso Ideal OMS
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {minIdealWeight} kg — {maxIdealWeight} kg
                    </span>
                  </div>
                )}
              </div>

              <p className={`text-xs mt-3 leading-relaxed ${category.textColor}`}>
                {category.description}
              </p>

              {/* Visual Meter Bar */}
              <div className="mt-4 pt-3 border-t border-black/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Abaixo (&lt;18.5)</span>
                  <span>Normal (18.5-25)</span>
                  <span>Sobrepeso (25-30)</span>
                  <span>Obesidade (30+)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex relative">
                  <div className="h-full bg-amber-400 w-[18.5%]" title="Abaixo do peso" />
                  <div className="h-full bg-emerald-500 w-[24.9%]" title="Peso normal" />
                  <div className="h-full bg-orange-400 w-[20%]" title="Sobrepeso" />
                  <div className="h-full bg-rose-500 w-[36.6%]" title="Obesidade" />
                </div>
                <div className="text-center mt-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Seu IMC calculado: <strong className="text-slate-900">{roundedBmi} kg/m²</strong>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              Informe valores válidos para peso e altura para calcular o IMC.
            </div>
          )}

          {/* Reference Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tabela Padrão de Classificação (OMS)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className={`px-3.5 py-2 flex items-center justify-between ${roundedBmi < 18.5 && roundedBmi > 0 ? 'bg-amber-50/70 font-bold' : ''}`}>
                <span className="text-slate-700">Abaixo de 18,5</span>
                <span className="text-amber-700 font-semibold">Abaixo do peso</span>
              </div>
              <div className={`px-3.5 py-2 flex items-center justify-between ${roundedBmi >= 18.5 && roundedBmi < 25 ? 'bg-emerald-50/70 font-bold' : ''}`}>
                <span className="text-slate-700">18,5 a 24,9</span>
                <span className="text-emerald-700 font-semibold">Peso ideal / Normal</span>
              </div>
              <div className={`px-3.5 py-2 flex items-center justify-between ${roundedBmi >= 25 && roundedBmi < 30 ? 'bg-orange-50/70 font-bold' : ''}`}>
                <span className="text-slate-700">25,0 a 29,9</span>
                <span className="text-orange-700 font-semibold">Sobrepeso</span>
              </div>
              <div className={`px-3.5 py-2 flex items-center justify-between ${roundedBmi >= 30 && roundedBmi < 35 ? 'bg-rose-50/70 font-bold' : ''}`}>
                <span className="text-slate-700">30,0 a 34,9</span>
                <span className="text-rose-700 font-semibold">Obesidade Grau I</span>
              </div>
              <div className={`px-3.5 py-2 flex items-center justify-between ${roundedBmi >= 35 && roundedBmi < 40 ? 'bg-red-50/70 font-bold' : ''}`}>
                <span className="text-slate-700">35,0 a 39,9</span>
                <span className="text-red-700 font-semibold">Obesidade Grau II</span>
              </div>
              <div className={`px-3.5 py-2 flex items-center justify-between ${roundedBmi >= 40 ? 'bg-purple-50/70 font-bold' : ''}`}>
                <span className="text-slate-700">40,0 ou mais</span>
                <span className="text-purple-700 font-semibold">Obesidade Grau III (Mórbida)</span>
              </div>
            </div>
          </div>

          {/* Muscle mass note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Dica do Personal:</strong> O IMC é uma métrica geral de triagem populacional. Para praticantes de musculação com alto percentual de massa muscular, utilize a avaliação física e fotos de evolução como critério complementar.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onSaveToStudent && studentName ? (
            <button
              id="save-bmi-to-student-btn"
              type="button"
              onClick={handleSave}
              disabled={savedSuccess}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Peso Atualizado no Perfil!</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Salvar Peso & Altura no Perfil ({numWeight}kg)</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium">
              Ajuste o peso e altura para simular diferentes cenários.
            </div>
          )}

          <button
            id="close-bmi-footer-btn"
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
