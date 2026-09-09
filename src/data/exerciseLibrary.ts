export interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: string;
  defaultSets: number;
  defaultReps: string;
  defaultRestSeconds: number;
  videoUrl: string;
  thumbnail: string;
  instructions: string;
  tips: string;
}

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  {
    id: 'lib_supino_reto',
    name: 'Supino Reto com Barra',
    muscleGroup: 'Peitoral',
    defaultSets: 4,
    defaultReps: '10 a 12',
    defaultRestSeconds: 60,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Deite-se no banco, apoie os pés no chão e mantenha as escápulas aduzidas. Desça a barra de forma controlada até a linha média do peito e empurre para cima sem travar bruscamente os cotovelos.',
    tips: 'Mantenha o peito estufado e os punhos alinhados com os antebraços.'
  },
  {
    id: 'lib_supino_inclinado',
    name: 'Supino Inclinado com Halteres',
    muscleGroup: 'Peitoral',
    defaultSets: 4,
    defaultReps: '10 a 12',
    defaultRestSeconds: 60,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Ajuste o banco em inclinação de 30° a 45°. Suba os halteres em linha reta convergindo levemente no topo, sem bater os pesos.',
    tips: 'Evite inclinação excessiva para não sobrecarregar o deltoide anterior.'
  },
  {
    id: 'lib_crucifixo_maquina',
    name: 'Crucifixo na Máquina (Peck Deck)',
    muscleGroup: 'Peitoral',
    defaultSets: 3,
    defaultReps: '12 a 15',
    defaultRestSeconds: 45,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Ajuste o assento para que as manoplas fiquem na altura do peito. Mantenha os cotovelos levemente flexionados durante todo o percurso e sinta o peitoral contrair no centro.',
    tips: 'Não deixe os cotovelos passarem excessivamente para trás na fase excêntrica.'
  },
  {
    id: 'lib_puxada_alta',
    name: 'Puxada Alta no Pulley (Pegada Pronada)',
    muscleGroup: 'Costas',
    defaultSets: 4,
    defaultReps: '10 a 12',
    defaultRestSeconds: 60,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Sente-se firme com os coxins travando as pernas. Puxe a barra em direção à parte superior do peitoral, puxando os cotovelos para baixo e para trás.',
    tips: 'Evite inclinar o tronco excessivamente para trás; foque na depressão das escápulas.'
  },
  {
    id: 'lib_remada_curvada',
    name: 'Remada Curvada com Barra',
    muscleGroup: 'Costas',
    defaultSets: 4,
    defaultReps: '8 a 10',
    defaultRestSeconds: 90,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Tronco inclinado a aproximadamente 45°, coluna neutra e joelhos levemente destravados. Puxe a barra na direção do umbigo mantendo os cotovelos próximos ao tronco.',
    tips: 'Mantenha o abdômen contraído para proteger a lombar.'
  },
  {
    id: 'lib_agachamento_livre',
    name: 'Agachamento Livre com Barra',
    muscleGroup: 'Pernas / Quadríceps',
    defaultSets: 4,
    defaultReps: '8 a 10',
    defaultRestSeconds: 90,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Pés na largura dos ombros com pontas apontando levemente para fora. Desça flexionando quadril e joelhos simultaneamente até as coxas ficarem paralelas ao chão.',
    tips: 'Não permita que os joelhos entrem em valgo (para dentro) durante a subida.'
  },
  {
    id: 'lib_leg_press_45',
    name: 'Leg Press 45º',
    muscleGroup: 'Pernas',
    defaultSets: 4,
    defaultReps: '10 a 12',
    defaultRestSeconds: 75,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Apoie as costas completamente no encosto e posicione os pés na plataforma na largura dos ombros. Destrave a máquina e desça até 90° de flexão nos joelhos sem tirar o quadril do banco.',
    tips: 'Nunca estenda totalmente os joelhos no topo (evite hiperextensão).'
  },
  {
    id: 'lib_cadeira_extensora',
    name: 'Cadeira Extensora',
    muscleGroup: 'Quadríceps',
    defaultSets: 3,
    defaultReps: '12 a 15',
    defaultRestSeconds: 45,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Ajuste o rolo sobre a parte frontal dos tornozelos. Estenda os joelhos de forma controlada segurando 1 segundo no pico de contração antes de descer.',
    tips: 'Segure firme nas manoplas laterais para manter o quadril colado no assento.'
  },
  {
    id: 'lib_elevacao_lateral',
    name: 'Elevação Lateral com Halteres',
    muscleGroup: 'Ombros',
    defaultSets: 4,
    defaultReps: '12 a 15',
    defaultRestSeconds: 45,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Fique de pé com halteres ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros, mantendo os cotovelos levemente flexionados.',
    tips: 'Inicie o movimento pelos cotovelos, e não pelos punhos. Não use impulso corporal.'
  },
  {
    id: 'lib_desenvolvimento_halteres',
    name: 'Desenvolvimento com Halteres no Banco',
    muscleGroup: 'Ombros',
    defaultSets: 4,
    defaultReps: '10 a 12',
    defaultRestSeconds: 60,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Sente-se em banco a 85-90°. Eleve os halteres acima da cabeça sem tocá-los, descendo até a altura das orelhas.',
    tips: 'Mantenha os cotovelos levemente à frente da linha dos ombros (plano escapular).'
  },
  {
    id: 'lib_rosca_direta',
    name: 'Rosca Direta com Barra W',
    muscleGroup: 'Bíceps',
    defaultSets: 4,
    defaultReps: '10 a 12',
    defaultRestSeconds: 60,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Cotovelos fixos ao lado das costelas. Flexione os braços levando a barra na direção dos ombros e desça de forma controlada até a extensão quase total.',
    tips: 'Não balance o tronco nem jogue os cotovelos para frente durante a subida.'
  },
  {
    id: 'lib_triceps_corda',
    name: 'Tríceps Corda no Pulley',
    muscleGroup: 'Tríceps',
    defaultSets: 4,
    defaultReps: '12 a 15',
    defaultRestSeconds: 45,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Fixe a corda na polia alta. Com os cotovelos junto ao tronco, empurre a corda para baixo abrindo as pontas no final do movimento.',
    tips: 'Mantenha o foco na contração máxima de 1 segundo embaixo.'
  },
  {
    id: 'lib_prancha_abdominal',
    name: 'Prancha Abdominal Isométrica',
    muscleGroup: 'Abdômen',
    defaultSets: 3,
    defaultReps: '40 a 60 segundos',
    defaultRestSeconds: 45,
    videoUrl: '',
    thumbnail: '',
    instructions: 'Apoie os antebraços e pontas dos pés no chão. Mantenha o corpo em linha reta da cabeça aos pés com abdômen e glúteos fortemente contraídos.',
    tips: 'Não deixe o quadril despencar nem subir excessivamente.'
  }
];

export const MUSCLE_GROUPS = [
  'Todos',
  'Peitoral',
  'Costas',
  'Pernas',
  'Quadríceps',
  'Posterior de Coxa',
  'Glúteos',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Panturrilhas',
  'Cardio'
];
