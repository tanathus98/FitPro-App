import { CardioEquipment } from '../types';

export interface CardioIntensityOption {
  id: string;
  label: string;
  description: string;
  met: number;
  level: 'leve' | 'moderada' | 'vigorosa' | 'hiit';
  defaultSpeedKmh?: number;
}

export interface CardioEquipmentInfo {
  id: CardioEquipment;
  name: string;
  category: string;
  description: string;
  iconName: string;
  unit: string;
  suggestedDistKm?: number;
  intensities: CardioIntensityOption[];
  tips: string;
}

export const CARDIO_EQUIPMENTS: Record<CardioEquipment, CardioEquipmentInfo> = {
  esteira: {
    id: 'esteira',
    name: 'Esteira Ergométrica',
    category: 'Caminhada & Corrida',
    description: 'Ideal para condicionamento aeróbico, queima de gordura e controle de ritmo.',
    iconName: 'Footprints',
    unit: 'km',
    suggestedDistKm: 3.5,
    tips: 'Mantenha o abdômen contraído, olhar no horizonte e evite segurar nos apoios laterais para maximizar o gasto calórico.',
    intensities: [
      {
        id: 'caminhada_leve',
        label: 'Caminhada Leve (4.0 - 4.5 km/h)',
        description: 'Ritmo suave de aquecimento ou recuperação.',
        met: 3.3,
        level: 'leve',
        defaultSpeedKmh: 4.2,
      },
      {
        id: 'caminhada_moderada',
        label: 'Caminhada Rápida (5.5 - 6.0 km/h)',
        description: 'Passo acelerado no plano, respiração leve.',
        met: 4.3,
        level: 'moderada',
        defaultSpeedKmh: 5.8,
      },
      {
        id: 'caminhada_inclinada',
        label: 'Caminhada Inclinada (5 km/h c/ 4-6% inclinação)',
        description: 'Excelente ativação de glúteos e panturrilhas com baixo impacto.',
        met: 6.5,
        level: 'moderada',
        defaultSpeedKmh: 5.0,
      },
      {
        id: 'trote_leve',
        label: 'Trote / Corrida Leve (7.5 - 8.5 km/h)',
        description: 'Corrida contínua e confortável em zona aeróbica.',
        met: 8.3,
        level: 'vigorosa',
        defaultSpeedKmh: 8.0,
      },
      {
        id: 'corrida_moderada',
        label: 'Corrida Moderada (9.5 - 10.5 km/h)',
        description: 'Ritmo constante e firme de alta demanda cardiovascular.',
        met: 10.0,
        level: 'vigorosa',
        defaultSpeedKmh: 10.0,
      },
      {
        id: 'corrida_intensa',
        label: 'Corrida Rápida / Tiros (12.0+ km/h)',
        description: 'Ritmo forte de velocidade ou subidas íngremes.',
        met: 12.5,
        level: 'hiit',
        defaultSpeedKmh: 12.0,
      },
    ],
  },
  bike: {
    id: 'bike',
    name: 'Bicicleta Ergométrica / Spinning',
    category: 'Ciclismo Indoor',
    description: 'Sem impacto articular nos joelhos e tornozelos, ótima para resistência de quadríceps.',
    iconName: 'Bike',
    unit: 'km',
    suggestedDistKm: 8.0,
    tips: 'Ajuste a altura do selim na altura da sua crista ilíaca (quadril) para proteger os joelhos e aumentar a potência da pedalada.',
    intensities: [
      {
        id: 'bike_leve',
        label: 'Pedalada Leve (Carga Baixa, <15 km/h)',
        description: 'Aquecimento e mobilidade com pedalada suave.',
        met: 4.8,
        level: 'leve',
        defaultSpeedKmh: 14.0,
      },
      {
        id: 'bike_moderada',
        label: 'Ritmo Moderado (Carga Média, 16-20 km/h)',
        description: 'Pedalada constante, ideal para queima contínua de gordura.',
        met: 6.8,
        level: 'moderada',
        defaultSpeedKmh: 18.0,
      },
      {
        id: 'bike_vigorosa',
        label: 'Ritmo Intenso (Carga Alta, 21-25 km/h)',
        description: 'Pedalada forte com resistência pesada na roda de inércia.',
        met: 8.8,
        level: 'vigorosa',
        defaultSpeedKmh: 23.0,
      },
      {
        id: 'bike_spinning',
        label: 'Aula de Spinning / HIIT Ciclismo',
        description: 'Alternância entre tiros em pé (climbing) e sprints velozes.',
        met: 10.8,
        level: 'hiit',
        defaultSpeedKmh: 26.0,
      },
    ],
  },
  eliptico: {
    id: 'eliptico',
    name: 'Elíptico / Transport',
    category: 'Membros Superiores & Inferiores',
    description: 'Trabalho sincronizado de pernas e braços com zero impacto articular.',
    iconName: 'Activity',
    unit: 'km',
    suggestedDistKm: 4.0,
    tips: 'Empurre e puxe as manoplas ativamente para envolver peitorais, costas e braços no gasto calórico total.',
    intensities: [
      {
        id: 'eliptico_leve',
        label: 'Ritmo Leve (Resistência baixa)',
        description: 'Movimento contínuo e suave.',
        met: 5.5,
        level: 'leve',
        defaultSpeedKmh: 4.5,
      },
      {
        id: 'eliptico_moderado',
        label: 'Ritmo Moderado (Resistência média)',
        description: 'Passada vigorosa com trabalho ativo de braços.',
        met: 7.2,
        level: 'moderada',
        defaultSpeedKmh: 6.0,
      },
      {
        id: 'eliptico_intenso',
        label: 'Ritmo Vigoroso / Carga alta',
        description: 'Alta resistência de frenagem magnética e ritmo forte.',
        met: 9.5,
        level: 'vigorosa',
        defaultSpeedKmh: 7.5,
      },
    ],
  },
  escada: {
    id: 'escada',
    name: 'Simulador de Escada (StairMaster)',
    category: 'Alta Queima & Glúteos',
    description: 'Um dos maiores gastos calóricos por minuto, com fortíssimo estímulo para glúteos e posteriores.',
    iconName: 'TrendingUp',
    unit: 'degraus',
    suggestedDistKm: 1.2,
    tips: 'Apoie o pé inteiro no degrau (não apenas a ponta) para ativar a musculatura dos glúteos e proteger a articulação do joelho.',
    intensities: [
      {
        id: 'escada_leve',
        label: 'Subida Leve (Nível 3 a 5)',
        description: 'Ritmo estável e cadenciado.',
        met: 7.5,
        level: 'moderada',
      },
      {
        id: 'escada_moderada',
        label: 'Subida Moderada (Nível 6 a 8)',
        description: 'Forte demanda muscular e cardíaca.',
        met: 9.5,
        level: 'vigorosa',
      },
      {
        id: 'escada_intensa',
        label: 'Subida Rápida / HIIT (Nível 9+)',
        description: 'Degraus acelerados ou subida alternada de 2 em 2.',
        met: 12.0,
        level: 'hiit',
      },
    ],
  },
  remo: {
    id: 'remo',
    name: 'Remo Seco (Rowing Machine)',
    category: 'Corpo Inteiro & Core',
    description: 'Recruta mais de 85% dos grupos musculares do corpo (pernas, costas, ombros e abdômen).',
    iconName: 'Zap',
    unit: 'm',
    suggestedDistKm: 3.0,
    tips: 'A sequência correta é: Pernas empurram -> Tronco estende -> Braços puxam. Na volta faça a ordem inversa!',
    intensities: [
      {
        id: 'remo_leve',
        label: 'Remada Moderada (~100-130 Watts)',
        description: 'Ritmo rítmico e cadenciado de respiração.',
        met: 7.0,
        level: 'moderada',
      },
      {
        id: 'remo_vigoroso',
        label: 'Remada Vigorosa (~150-200 Watts)',
        description: 'Puxadas fortes com alta cadência e potência.',
        met: 8.8,
        level: 'vigorosa',
      },
      {
        id: 'remo_hiit',
        label: 'Tiros de Potência / Sprints 500m',
        description: 'Potência máxima e aceleração nos pés e puxador.',
        met: 11.5,
        level: 'hiit',
      },
    ],
  },
  corda: {
    id: 'corda',
    name: 'Pular Corda',
    category: 'Agilidade & Pliometria',
    description: 'Exercício de alta intensidade com excelente resposta neuromuscular e queima rápida.',
    iconName: 'Flame',
    unit: 'saltos',
    tips: 'Pule apenas o suficiente para a corda passar (1 a 2 cm do chão) e amorteça na ponta dos pés.',
    intensities: [
      {
        id: 'corda_moderada',
        label: 'Ritmo Moderado (<100 saltos/min)',
        description: 'Saltos regulares com ritmo constante.',
        met: 8.8,
        level: 'vigorosa',
      },
      {
        id: 'corda_intensa',
        label: 'Ritmo Acelerado (120-140 saltos/min)',
        description: 'Saltos rápidos ou alternados.',
        met: 11.8,
        level: 'vigorosa',
      },
      {
        id: 'corda_hiit',
        label: 'HIIT com Corda / Double Unders',
        description: 'Intervalos com saltos duplos e velocidade máxima.',
        met: 12.5,
        level: 'hiit',
      },
    ],
  },
  outro: {
    id: 'outro',
    name: 'Outro Aeróbico / Funcional',
    category: 'Geral',
    description: 'Polichinelos, burpees, circuito funcional, caminhada externa ou corrida de rua.',
    iconName: 'Activity',
    unit: 'min',
    tips: 'Monitore sua frequência cardíaca para manter-se na faixa de intensidade planejada.',
    intensities: [
      {
        id: 'outro_leve',
        label: 'Aeróbico Leve',
        description: 'Esforço fácil (conversa sem ofegar).',
        met: 4.0,
        level: 'leve',
      },
      {
        id: 'outro_moderado',
        label: 'Aeróbico Moderado',
        description: 'Respiração acelerada, sudorese contínua.',
        met: 6.5,
        level: 'moderada',
      },
      {
        id: 'outro_vigoroso',
        label: 'Aeróbico Intenso',
        description: 'Respiração profunda e esforço constante.',
        met: 9.0,
        level: 'vigorosa',
      },
      {
        id: 'outro_hiit',
        label: 'Treino Intervalado de Alta Intensidade (HIIT)',
        description: 'Picos de frequência cardíaca máxima.',
        met: 11.5,
        level: 'hiit',
      },
    ],
  },
};

export interface CardioCalculationResult {
  caloriesBurned: number;
  fatGramsBurned: number;
  caloriesPerMinute: number;
  trainingZone: {
    name: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
  };
  paceMinPerKm?: string;
  equivalentKcalComparisons: {
    label: string;
    value: string;
  }[];
}

export function calculateCardioCalories(params: {
  met: number;
  durationMinutes: number;
  weightKg: number;
  distanceKm?: number;
}): CardioCalculationResult {
  const { met, durationMinutes, weightKg, distanceKm } = params;

  // Scientific clinical formula: (MET * 3.5 * weightKg / 200) * durationMinutes
  const rawCalories = (met * 3.5 * (weightKg || 70) / 200) * (durationMinutes || 0);
  const caloriesBurned = Math.max(0, Math.round(rawCalories));

  // Adipose fat tissue equivalent (~7.7 kcal per gram of body fat)
  const fatGramsBurned = caloriesBurned > 0 ? Math.round((caloriesBurned / 7.7) * 10) / 10 : 0;

  // Rate
  const caloriesPerMinute = durationMinutes > 0 ? Math.round((caloriesBurned / durationMinutes) * 10) / 10 : 0;

  // Training Zone
  let trainingZone = {
    name: 'Zona 1 • Recuperação Ativa',
    description: 'Intensidade leve, melhora da circulação e remoção de metabólitos.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  };

  if (met >= 4.5 && met < 7.5) {
    trainingZone = {
      name: 'Zona 2 • Queima Aeróbica de Gordura',
      description: 'Zona ideal para oxidação lipídica e fortalecimento mitocondrial sem estresse articular excessivo.',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    };
  } else if (met >= 7.5 && met < 10.5) {
    trainingZone = {
      name: 'Zona 3 • Resistência Cardiovascular',
      description: 'Aumento significativo da capacidade cardiorrespiratória (VO2) e queima calórica total elevada.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    };
  } else if (met >= 10.5) {
    trainingZone = {
      name: 'Zona 4/5 • Alta Intensidade & Limiar Anaeróbico',
      description: 'Estímulo glicolítico vigoroso com efeito EPOC (queima calórica pós-exercício prolongada).',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    };
  }

  // Pace if distance provided
  let paceMinPerKm: string | undefined;
  if (distanceKm && distanceKm > 0 && durationMinutes > 0) {
    const totalMinutesPerKm = durationMinutes / distanceKm;
    const paceMinutes = Math.floor(totalMinutesPerKm);
    const paceSeconds = Math.round((totalMinutesPerKm - paceMinutes) * 60);
    const secPadded = paceSeconds < 10 ? `0${paceSeconds}` : `${paceSeconds}`;
    paceMinPerKm = `${paceMinutes}'${secPadded}" /km`;
  }

  // Comparisons for visual motivation
  const equivalentKcalComparisons = [
    { label: 'Gordura corporal equivalente', value: `~${fatGramsBurned}g de gordura oxidada` },
    { label: 'Gasto médio por minuto', value: `${caloriesPerMinute} kcal/min` },
  ];

  return {
    caloriesBurned,
    fatGramsBurned,
    caloriesPerMinute,
    trainingZone,
    paceMinPerKm,
    equivalentKcalComparisons,
  };
}
