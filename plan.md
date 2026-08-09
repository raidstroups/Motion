# MASTER PROMPT — AI AUTONOMOUS VIDEO POST-PRODUCTION & VFX PLATFORM

## 1. OBJETIVO DO PROJETO

Crie uma plataforma web profissional de pós-produção audiovisual assistida por agentes de IA.

O sistema deve receber um ou mais vídeos existentes enviados pelo usuário e permitir que o usuário descreva, em linguagem natural, tudo o que deseja alterar.

A plataforma deve funcionar como um **AI Post-Production Studio**, combinando:

* NLE (Non-Linear Editor)
* compositor VFX
* color grading
* processamento de áudio
* motion tracking
* rotoscopia
* segmentation
* object removal
* chroma key
* masking
* image restoration
* áudio isolation
* noise reduction
* transições cinematográficas
* análise semântica de vídeo
* planejamento autônomo por agentes
* renderização GPU
* controle temporal preciso
* QA automático

O objetivo NÃO é gerar um vídeo novo a partir de um prompt.

O objetivo é:

> **Preservar o vídeo original e realizar somente as modificações solicitadas pelo usuário, mantendo identidade, composição, temporalidade, movimento, áudio e características originais sempre que possível.**

A IA deve atuar como um **diretor técnico de pós-produção**, planejando e coordenando ferramentas especializadas.

---

# 2. PRINCÍPIO FUNDAMENTAL

NÃO implemente o sistema como:

```text
vídeo
→ IA generativa
→ novo vídeo
```

O sistema deve funcionar como:

```text
vídeo original
      ↓
análise
      ↓
compreensão semântica
      ↓
plano de edição
      ↓
localização temporal
      ↓
localização espacial
      ↓
tracking
      ↓
máscaras
      ↓
processamento seletivo
      ↓
composição
      ↓
render
      ↓
QA
      ↓
vídeo final
```

A IA deve modificar somente:

* frames necessários;
* regiões necessárias;
* objetos necessários;
* canais de áudio necessários;
* intervalos temporais necessários.

Nunca processe todo o vídeo novamente se somente uma pequena região precisa ser alterada.

---

# 3. STACK PRINCIPAL

## Frontend

Utilizar:

* Next.js 16+
* React
* TypeScript
* App Router
* Tailwind CSS
* shadcn/ui
* Radix UI
* Zustand
* TanStack Query
* React Hook Form
* Zod
* Framer Motion
* Lucide React

Para timeline e editor:

* Remotion
* WebCodecs API quando disponível
* Canvas API
* WebGL/WebGPU
* OffscreenCanvas
* Three.js quando necessário para visualização 3D/VFX
* `@react-three/fiber` somente onde houver necessidade real de 3D

A interface deve possuir arquitetura semelhante a um editor profissional:

```text
┌──────────────────────────────────────────────┐
│ Project     Edit     View      Render Export │
├──────────────────────────────────────────────┤
│                                              │
│                 VIDEO PREVIEW                │
│                                              │
├──────────────────────────────────────────────┤
│ Timeline                                     │
│                                              │
│ VIDEO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ VFX   ───────██████████──────────────────── │
│ MASK  ───────██████████──────────────────── │
│ AUDIO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                              │
├──────────────────────────────────────────────┤
│ AI COMMAND                                   │
│ > Remova o homem atrás de mim                │
│ > Clareie meu rosto                         │
│ > Melhore minha voz                         │
└──────────────────────────────────────────────┘
```

---

# 4. BACKEND

Utilizar:

* Next.js Route Handlers para APIs leves
* TypeScript
* Vercel AI SDK para orquestração de LLMs/agentes
* Zod para schemas
* PostgreSQL/Supabase
* Redis para estados temporários/cache quando necessário
* object storage para mídia
* filas/jobs para processamento pesado

IMPORTANTE:

Não realizar processamento pesado de vídeo dentro de Serverless Functions da Vercel.

A Vercel deve hospedar:

* frontend;
* APIs leves;
* autenticação;
* controle de projetos;
* comunicação com agentes;
* criação de jobs;
* monitoramento.

O processamento de mídia deve ocorrer em workers externos com CPU/GPU.

---

# 5. ARQUITETURA GLOBAL

Implementar:

```text
                         USER
                           │
                           ↓
                  ┌─────────────────┐
                  │   NEXT.JS APP   │
                  │   EDITOR / UI   │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │  API / CONTROL  │
                  │     PLANE       │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │ DIRECTOR AGENT  │
                  └────────┬────────┘
                           │
        ┌──────────────────┼───────────────────┐
        ↓                  ↓                   ↓
 VIDEO ANALYZER      AUDIO ANALYZER      PROJECT ANALYZER
        │                  │                   │
        └──────────────────┼───────────────────┘
                           ↓
                  ┌─────────────────┐
                  │ EDIT PLAN / EDL │
                  └────────┬────────┘
                           │
       ┌───────────────────┼────────────────────┐
       ↓                   ↓                    ↓
   VFX AGENT          AUDIO AGENT         TRANSITION AGENT
       │                   │                    │
       ↓                   ↓                    ↓
 SEGMENTATION         DSP / AI AUDIO       MOTION ANALYSIS
 TRACKING             ISOLATION            FRAME MATCHING
 MASKING              CLEANUP              TRANSITION
 INPAINTING           MIXING
       │                   │                    │
       └───────────────────┼────────────────────┘
                           ↓
                    COMPOSITOR ENGINE
                           ↓
                      RENDER ENGINE
                           ↓
                       QA AGENT
                           │
                  ┌────────┴────────┐
                  ↓                 ↓
                PASS              FAIL
                  │                 │
                  ↓                 ↓
               EXPORT         REPROCESS REGION
```

---

# 6. DIRECTOR AGENT

Este é o agente principal.

Responsabilidades:

1. interpretar instruções;
2. analisar intenção;
3. identificar operações necessárias;
4. identificar quais agentes precisam ser acionados;
5. determinar intervalos temporais;
6. determinar objetos/regiões;
7. criar plano de execução;
8. verificar dependências;
9. executar agentes;
10. analisar resultados;
11. solicitar correções;
12. aprovar o resultado final.

Não permita que o Director Agent execute operações diretamente.

Ele deve chamar ferramentas especializadas.

Utilizar:

* Vercel AI SDK
* structured outputs
* tool calling
* Zod
* modelos multimodais/VLM

O agente deve produzir um `EditPlan`.

Exemplo:

```ts
type EditPlan = {
  projectId: string;

  operations: EditOperation[];

  dependencies: OperationDependency[];

  renderStrategy: RenderStrategy;

  qualityTarget: QualityTarget;
};
```

---

# 7. EDIT OPERATION

Criar um sistema fortemente tipado.

Exemplo:

```ts
type EditOperation =
  | ObjectRemovalOperation
  | ObjectReplacementOperation
  | ColorCorrectionOperation
  | LightingOperation
  | BlurOperation
  | TrackingOperation
  | MaskOperation
  | ChromaKeyOperation
  | AudioIsolationOperation
  | NoiseReductionOperation
  | VoiceEnhancementOperation
  | TransitionOperation
  | StabilizationOperation
  | UpscaleOperation
  | SceneCutOperation;
```

Cada operação deve possuir:

```ts
type BaseOperation = {
  id: string;
  type: string;

  sourceClipId: string;

  startTime: number;
  endTime: number;

  priority: number;

  status:
    | "planned"
    | "analyzing"
    | "processing"
    | "compositing"
    | "qa"
    | "completed"
    | "failed";

  confidence: number;

  dependencies: string[];
};
```

---

# 8. VIDEO ANALYZER AGENT

Responsável por compreender o vídeo antes de qualquer edição.

Detectar:

* scenes;
* shots;
* cuts;
* people;
* faces;
* objects;
* vehicles;
* animals;
* text;
* logos;
* background;
* foreground;
* camera movement;
* object movement;
* lighting;
* exposure;
* color profile;
* motion blur;
* depth;
* audio events.

Produzir:

```ts
type VideoAnalysis = {
  scenes: Scene[];
  shots: Shot[];
  objects: TrackedObject[];
  faces: FaceTrack[];
  cameraMotion: CameraMotion[];
  visualIssues: VisualIssue[];
};
```

Bibliotecas/motores possíveis:

* OpenCV
* PyTorch
* ONNX Runtime
* FFmpeg
* MediaPipe
* Ultralytics/YOLO
* SAM/SAM2 ou equivalente para segmentation
* Grounding DINO ou equivalente para text-prompt object detection
* optical flow algorithms

A camada TypeScript deve chamar esses modelos por API/worker, não tentar executar modelos pesados dentro do Next.js.

---

# 9. SEMANTIC OBJECT REGISTRY

Criar um registro persistente de objetos detectados.

Exemplo:

```text
Person_001
Person_002
Car_001
Table_001
Logo_001
Face_001
```

Cada objeto deve possuir:

```ts
type TrackedObject = {
  id: string;

  category: string;

  label?: string;

  confidence: number;

  firstFrame: number;

  lastFrame: number;

  boundingBoxes: BoundingBox[];

  masks?: MaskReference[];

  trackingData?: TrackingData;

  embeddings?: number[];

  attributes?: Record<string, unknown>;
};
```

O objetivo é permitir:

> "Remova a pessoa atrás de mim."

sem que o sistema precise redetectar a pessoa independentemente em todos os frames.

---

# 10. FRAME PIPELINE

NÃO armazenar todos os frames permanentemente como WebP.

Use uma arquitetura híbrida.

Pipeline:

```text
Original Video
       ↓
FFmpeg / decoder
       ↓
Proxy
       ↓
Low-resolution analysis frames
       ↓
Scene detection
       ↓
Object detection
       ↓
Tracking
       ↓
Identify affected ranges
       ↓
Decode original frames only when needed
       ↓
GPU processing
       ↓
Composite
       ↓
Encode
```

Para preview:

* JPEG/WebP/AVIF
* baixa resolução
* thumbnails
* sprites
* proxy video

Para processamento:

* frames lossless quando necessário
* PNG/TIFF/EXR dependendo da operação
* acesso direto ao frame original quando possível

Nunca usar WebP como formato intermediário obrigatório para VFX de alta qualidade.

---

# 11. FRAME INDEX

Criar índice temporal.

```ts
type FrameReference = {
  frameNumber: number;
  timestamp: number;
  keyframe: boolean;
  sourceClipId: string;
};
```

Isso permite mapear:

```text
00:01:23.400
        ↓
frame 2502
```

e:

```text
object Person_003
        ↓
frames 2502–2740
```

---

# 12. VFX AGENT

Criar um agente dedicado para pós-produção visual.

Responsabilidades:

* object removal;
* object replacement;
* face blur;
* background blur;
* masking;
* rotoscoping;
* segmentation;
* chroma key;
* compositing;
* motion tracking;
* stabilization;
* lighting correction;
* shadow correction;
* selective color correction;
* cleanup;
* image restoration.

Bibliotecas:

### Core

* OpenCV
* FFmpeg
* NumPy
* PyTorch
* ONNX Runtime
* CUDA

### Segmentation

* SAM/SAM2 ou equivalente
* MediaPipe
* YOLO segmentation

### Tracking

* OpenCV trackers
* optical flow
* ByteTrack
* BoT-SORT
* DeepSORT quando apropriado

### Compositing

* OpenCV
* GPU shaders
* WebGL/WebGPU para preview
* FFmpeg filters
* OpenColorIO

---

# 13. OBJECT REMOVAL

Quando o usuário disser:

> Remova o homem.

O pipeline deve ser:

```text
Director
 ↓
Video Analyzer
 ↓
identify Person_X
 ↓
determine temporal range
 ↓
segmentation
 ↓
mask generation
 ↓
tracking
 ↓
mask validation
 ↓
background reconstruction
 ↓
temporal consistency
 ↓
composite
 ↓
QA
```

Nunca aplicar remoção globalmente.

Processar somente:

```text
affectedFrames
+
affectedRegion
```

Sempre preservar:

* câmera;
* background;
* iluminação;
* perspectiva;
* textura;
* ruído;
* grain;
* motion blur.

Quando houver inpainting generativo, utilizá-lo SOMENTE dentro da máscara definida.

Não regenerar o frame inteiro.

---

# 14. MASK SYSTEM

Criar sistema de máscaras temporais.

```ts
type Mask = {
  id: string;

  frameRange: {
    start: number;
    end: number;
  };

  geometry:
    | "polygon"
    | "raster"
    | "segmentation"
    | "bezier";

  data: string;

  feather: number;

  expansion: number;

  trackingId?: string;
};
```

Permitir:

* feather;
* expansion;
* contraction;
* inversion;
* intersection;
* union;
* subtraction;
* animated masks.

---

# 15. TRACKING ENGINE

Toda operação envolvendo objetos móveis deve poder utilizar tracking.

Pipeline:

```text
initial detection
        ↓
segmentation
        ↓
tracking
        ↓
occlusion detection
        ↓
re-detection
        ↓
tracking correction
```

O sistema deve detectar quando o tracking perdeu o objeto.

Nunca continuar silenciosamente com uma máscara errada.

---

# 16. COLOR AGENT

Criar agente específico para:

* exposure;
* contrast;
* highlights;
* shadows;
* whites;
* blacks;
* temperature;
* tint;
* saturation;
* vibrance;
* curves;
* LUT;
* HDR;
* local correction.

Bibliotecas:

* OpenColorIO
* FFmpeg
* OpenCV
* GPU shaders
* WebGL/WebGPU

Suportar:

```text
global correction
scene correction
shot correction
object correction
face correction
mask-based correction
```

Exemplo:

> Clareie meu rosto sem clarear o fundo.

Pipeline:

```text
Face detection
 ↓
Face segmentation
 ↓
tracking
 ↓
mask
 ↓
local exposure
 ↓
shadow lift
 ↓
color preservation
```

---

# 17. LIGHTING AGENT

Permitir instruções:

* clarear rosto;
* escurecer fundo;
* remover sombra;
* reduzir highlights;
* aumentar sombras;
* equilibrar iluminação;
* simular fill light;
* corrigir iluminação inconsistente.

O agente deve utilizar máscaras e tracking.

Nunca alterar todo o frame quando a instrução for localizada.

---

# 18. AUDIO PIPELINE

Separar o áudio do vídeo.

```text
Video
 ↓
Demux
 ↓
Audio tracks
 ↓
Speech detection
 ↓
Speaker detection
 ↓
Music detection
 ↓
Noise detection
 ↓
Processing
 ↓
Mix
 ↓
Remux
```

Criar:

## Audio Agent

Responsável por:

* voice isolation;
* speaker isolation;
* noise reduction;
* hum removal;
* echo reduction;
* de-reverberation;
* EQ;
* compression;
* loudness normalization;
* clipping repair;
* silence detection;
* background music ducking.

Bibliotecas/motores:

* FFmpeg
* Web Audio API para preview
* Essentia
* librosa
* PyTorch audio models
* Demucs ou equivalente para source separation
* Whisper para speech/transcription
* RNNoise ou equivalente para noise suppression

---

# 19. SPEAKER ISOLATION

Se o usuário disser:

> Isole somente a voz da mulher.

O sistema deve:

```text
audio
 ↓
speaker diarization
 ↓
speaker identification
 ↓
speech segments
 ↓
source separation
 ↓
noise reduction
 ↓
EQ
 ↓
gain
```

Utilizar modelos de speaker diarization e source separation.

Nunca modificar o áudio inteiro se somente um trecho foi solicitado.

---

# 20. AUDIO TEMPORAL PROCESSING

Toda operação de áudio deve possuir:

```ts
startTime
endTime
channels
targetSpeaker
processingChain
```

Exemplo:

```ts
{
  type: "voice_enhancement",

  startTime: 133.4,

  endTime: 138.7,

  targetSpeaker: "speaker_02",

  processing: {
    noiseReduction: true,
    isolation: true,
    gain: 4,
    compression: true
  }
}
```

---

# 21. TRANSITION AGENT

Quando houver múltiplos vídeos:

```text
Clip A
   ↓
Clip B
```

o agente deve analisar:

### Clip A

* últimos frames;
* movimento;
* câmera;
* objetos;
* direção;
* profundidade;
* iluminação;
* cores;
* velocidade.

### Clip B

* primeiros frames;
* movimento;
* câmera;
* objetos;
* direção;
* profundidade;
* iluminação;
* cores;
* velocidade.

Depois selecionar ou construir uma transição.

Possibilidades:

* cross dissolve;
* match cut;
* motion transition;
* whip transition;
* zoom transition;
* object occlusion;
* light transition;
* directional blur;
* masked transition;
* morph;
* camera-motion continuation;
* optical-flow transition.

Não usar simplesmente um crossfade por padrão.

---

# 22. CINEMATIC TRANSITION ENGINE

Para criar transições contextuais:

```text
last frames of A
       +
first frames of B
       ↓
motion analysis
       ↓
feature matching
       ↓
camera direction
       ↓
object correspondence
       ↓
color compatibility
       ↓
transition candidate generation
       ↓
score
       ↓
best transition
       ↓
QA
```

A transição deve parecer parte natural da filmagem.

---

# 23. COMPOSITOR

Criar um compositor intermediário.

Ele deve combinar:

```text
original frame
+
masks
+
VFX layers
+
color adjustments
+
object removal
+
blur
+
tracking
+
transition
```

Nunca sobrescrever o original.

Utilizar arquitetura não destrutiva:

```text
Original
   ↓
Operation 1
   ↓
Operation 2
   ↓
Operation 3
   ↓
Composite
```

Cada operação deve poder ser:

* ativada;
* desativada;
* modificada;
* reordenada;
* revertida.

---

# 24. NON-DESTRUCTIVE EDITING

O projeto deve armazenar instruções, não somente arquivos finais.

Exemplo:

```text
Project
 ├── Assets
 ├── Clips
 ├── Scenes
 ├── Objects
 ├── Masks
 ├── Audio
 ├── Operations
 ├── Timeline
 ├── Render Jobs
 └── QA Results
```

Uma operação deve poder ser recalculada sem destruir as anteriores.

---

# 25. RENDER ENGINE

O render final deve utilizar:

* FFmpeg
* hardware acceleration
* CUDA quando disponível
* NVENC quando disponível
* VAAPI quando aplicável
* VideoToolbox quando aplicável

Suportar:

* H.264
* H.265/HEVC
* AV1
* ProRes quando necessário
* DNxHR quando necessário

Preservar:

* FPS;
* resolução;
* aspect ratio;
* audio sync;
* color metadata;
* HDR metadata quando aplicável.

---

# 26. GPU WORKERS

Não processar 4K pesado no servidor Next.js.

Criar workers separados:

```text
GPU Worker
├── video analysis
├── segmentation
├── tracking
├── VFX
├── color
├── audio AI
└── rendering
```

Tecnologias:

* Python
* PyTorch
* CUDA
* FFmpeg
* OpenCV
* ONNX Runtime
* FastAPI ou serviço equivalente

O backend TypeScript conversa com esses workers via:

* HTTP;
* gRPC;
* queue;
* object storage;
* job IDs.

---

# 27. JOB QUEUE

Cada operação deve virar um job.

Exemplo:

```ts
type RenderJob = {
  id: string;

  projectId: string;

  operationId: string;

  type: JobType;

  priority: number;

  status:
    | "queued"
    | "running"
    | "completed"
    | "failed";

  progress: number;

  workerId?: string;

  inputAssets: string[];

  outputAssets?: string[];

  error?: string;
};
```

A arquitetura deve permitir:

```text
Project
   ↓
Edit Plan
   ↓
Job Graph
   ↓
Queue
   ↓
Workers
```

Operações independentes devem ser executadas em paralelo.

Operações dependentes devem respeitar DAG/dependency ordering.

---

# 28. JOB GRAPH

Exemplo:

```text
Scene Analysis
      ↓
Object Detection
      ↓
Tracking
      ↓
Mask Generation
      ↓
Object Removal
      ↓
Color Correction
      ↓
Composite
      ↓
QA
      ↓
Render
```

Se Color Correction não depende de Object Removal:

```text
             ┌── Object Removal ──┐
Analysis ────┤                    ├── Composite
             └── Color Grade ─────┘
```

Executar em paralelo.

---

# 29. QA AGENT

Criar um agente dedicado exclusivamente a verificar o resultado.

Comparar:

```text
original
vs
edited
vs
edit plan
```

Verificar:

* objeto realmente removido;
* máscara correta;
* tracking correto;
* rosto preservado;
* mãos preservadas;
* textura;
* iluminação;
* cor;
* artefatos;
* ghosting;
* flickering;
* warping;
* audio sync;
* frames corrompidos;
* transição;
* volume;
* clipping.

Se falhar:

```text
QA
 ↓
failure classification
 ↓
responsible agent
 ↓
reprocess only affected region
 ↓
QA again
```

Não reprocessar o projeto inteiro.

---

# 30. TEMPORAL CONSISTENCY

Todo VFX que afeta múltiplos frames deve possuir consistência temporal.

Evitar:

* flickering;
* máscaras tremendo;
* objetos deformando;
* mudanças abruptas de iluminação;
* texture crawling;
* ghosting;
* inconsistência de cor.

O processamento deve considerar frames vizinhos.

Não tratar cada frame como uma imagem completamente independente.

---

# 31. PIXEL-LEVEL PROCESSING

O requisito de “pixel a pixel” deve ser interpretado tecnicamente como:

> Cada frame pode ser processado em nível de pixel, mas somente dentro da região afetada pela operação.

Exemplo:

```text
4K frame

┌──────────────────────────────┐
│                              │
│       background             │
│                              │
│           ┌──────┐           │
│           │MASK  │           │
│           │      │           │
│           └──────┘           │
│                              │
└──────────────────────────────┘
```

O sistema não deve recalcular desnecessariamente os pixels fora da máscara.

---

# 32. PREVIEW ENGINE

O usuário deve visualizar alterações antes do render final.

Implementar:

* proxy preview;
* low-resolution preview;
* before/after;
* split view;
* mask visualization;
* object tracking visualization;
* timeline;
* frame stepping;
* audio waveform;
* VFX layers.

Usar:

* WebCodecs;
* Canvas;
* WebGL/WebGPU;
* Remotion quando adequado.

---

# 33. VERSIONING

Cada edição deve possuir versão.

```text
Version 1
Version 2
Version 3
```

Permitir:

* rollback;
* compare;
* duplicate;
* branch;
* restore.

Exemplo:

```text
V1 original
V2 object removal
V3 color correction
V4 audio enhancement
V5 final
```

---

# 34. DATABASE

Utilizar Supabase/PostgreSQL.

Tabelas principais:

```text
users
projects
assets
clips
scenes
shots
objects
object_tracks
faces
masks
audio_tracks
audio_segments
edit_operations
operation_dependencies
render_jobs
render_outputs
qa_results
timeline_tracks
timeline_items
project_versions
agent_runs
agent_messages
```

Utilizar:

* PostgreSQL
* JSONB para dados variáveis
* indexes temporais
* foreign keys
* RLS
* Supabase Storage quando apropriado.

---

# 35. STORAGE

Separar:

```text
original/
proxy/
analysis/
masks/
audio/
intermediate/
renders/
exports/
```

Nunca misturar arquivos temporários com originais.

Originais devem ser imutáveis.

---

# 36. TYPESCRIPT ARCHITECTURE

Estruturar o projeto aproximadamente:

```text
apps/
  web/

packages/
  ai/
  agents/
  media/
  timeline/
  vfx/
  audio/
  render/
  storage/
  database/
  shared/
  schemas/

workers/
  video-worker/
  audio-worker/
  vfx-worker/
  render-worker/
```

---

# 37. AGENT PACKAGE

Criar:

```text
packages/agents/

director/
video-analyzer/
audio-analyzer/
vfx/
color/
lighting/
audio/
transition/
qa/
```

Cada agente deve possuir:

```text
agent.ts
tools.ts
schemas.ts
prompts.ts
types.ts
validators.ts
```

---

# 38. TOOL-CALLING

O LLM nunca deve executar shell commands diretamente.

Ele deve chamar ferramentas tipadas.

Exemplo:

```ts
removeObject({
  clipId,
  objectId,
  startFrame,
  endFrame
})
```

ou:

```ts
applyColorCorrection({
  clipId,
  maskId,
  startFrame,
  endFrame,
  adjustments
})
```

ou:

```ts
processAudioSegment({
  trackId,
  startTime,
  endTime,
  operation
})
```

O backend valida os parâmetros antes de executar.

---

# 39. SECURITY

Nunca permitir que um agente tenha acesso arbitrário ao sistema operacional.

Implementar:

* sandbox;
* allowlist de ferramentas;
* validação Zod;
* limite de arquivos;
* limite de resolução;
* limite de duração;
* autenticação;
* autorização;
* isolamento por projeto;
* signed URLs;
* expiração de assets temporários.

---

# 40. COST OPTIMIZATION

O sistema deve ser agressivamente econômico.

Nunca:

```text
10 minutos
×
30 FPS
×
4K
×
AI inference
```

se a alteração ocupa somente:

```text
00:42 → 00:47
```

Processar somente:

```text
00:42 → 00:47
+
padding temporal
```

e somente:

```text
affected region
```

Utilizar:

* proxy;
* caching;
* memoization;
* result reuse;
* content hashing;
* frame caching;
* mask caching;
* tracking caching;
* model caching.

Se uma operação já foi calculada, reutilizar seu resultado.

---

# 41. CONTENT HASHING

Criar hashes para:

```text
original asset
frame
operation
model
parameters
mask
```

Exemplo:

```ts
operationHash =
hash(
  sourceAsset +
  operationType +
  parameters +
  modelVersion +
  maskVersion
)
```

Se o hash já existir:

```text
CACHE HIT
```

não recalcular.

---

# 42. OBSERVABILITY

Registrar:

* agent runs;
* token usage;
* model;
* latency;
* GPU time;
* CPU time;
* render time;
* failed jobs;
* retries;
* cache hits;
* cache misses;
* storage usage.

Utilizar:

* OpenTelemetry
* logs estruturados
* métricas
* tracing

---

# 43. USER EXPERIENCE

O usuário deve poder simplesmente escrever:

> "Remova o homem que aparece atrás de mim entre 1:20 e 1:35, deixe meu rosto um pouco mais claro, diminua o brilho do fundo e remova o ruído da minha voz."

O sistema deve responder algo como:

```text
ANALISANDO VÍDEO

✓ 3 cenas detectadas
✓ 8 pessoas detectadas
✓ 2 faixas de áudio detectadas

ENCONTREI:

Person_04
00:01:21.200 → 00:01:34.900

AÇÕES PLANEJADAS:

✓ Remover Person_04
✓ Tracking automático
✓ Correção localizada do rosto
✓ Redução de exposição do background
✓ Isolamento da voz
✓ Noise reduction

Estimativa:
23 operações
```

E então permitir:

**Executar edição**

---

# 44. HUMAN-IN-THE-LOOP

O sistema deve funcionar autonomamente, mas permitir intervenção humana.

Usuário pode:

* aceitar;
* rejeitar;
* alterar máscara;
* escolher outro objeto;
* ajustar intensidade;
* mudar duração;
* desfazer operação;
* pedir nova edição.

Exemplo:

> "Não era essa pessoa."

O agente deve selecionar outra detecção sem destruir o restante do plano.

---

# 45. NATURAL LANGUAGE ITERATION

Depois do primeiro render:

> "Ficou bom, mas o rosto ficou claro demais."

O agente deve descobrir:

```text
qual operação causou a alteração
```

e ajustar somente essa operação.

Não deve começar tudo novamente.

---

# 46. EDIT HISTORY SEMANTIC

Guardar:

```text
User:
"clareie meu rosto"

Director:
ColorAgent

ColorAgent:
exposure +0.35
shadow +0.18

QA:
PASS
```

Assim o agente entende o histórico do projeto.

---

# 47. NÃO USAR IA GENERATIVA SEM NECESSIDADE

Regra absoluta:

> Se uma operação puder ser realizada deterministicamente, utilize processamento determinístico.

Exemplos:

```text
crop → FFmpeg
resize → GPU
exposure → shader
blur → GPU
cut → FFmpeg
fade → FFmpeg
mix → FFmpeg
audio gain → FFmpeg
color matrix → shader
```

IA deve ser utilizada para:

```text
understanding
segmentation
tracking
classification
inpainting
source separation
semantic decisions
QA
```

---

# 48. MODEL ABSTRACTION

Não acoplar o sistema a um único provedor de IA.

Criar:

```ts
interface VisionModel {
  analyze(input: VisionInput): Promise<VisionResult>;
}

interface SegmentationModel {
  segment(input: SegmentationInput): Promise<Mask>;
}

interface AudioModel {
  process(input: AudioInput): Promise<AudioResult>;
}
```

Permitir trocar modelos sem modificar os agentes.

---

# 49. MODEL ROUTING

Criar sistema de seleção de modelo.

Operações simples:

```text
cheap model
```

Operações complexas:

```text
high-quality model
```

Exemplo:

```text
object detection
→ lightweight model

complex VFX analysis
→ stronger VLM

final QA
→ high-quality VLM
```

---

# 50. QUALITY MODES

Oferecer:

### Draft

* proxy
* menor resolução
* processamento rápido

### High Quality

* resolução original
* modelos melhores
* maior precisão

### Cinematic Master

* máxima qualidade
* temporal consistency
* high precision segmentation
* high-quality rendering
* maximum QA

---

# 51. IMPORTANT ARCHITECTURAL RULE

O sistema deve separar claramente:

```text
AI DECISION LAYER
```

de:

```text
MEDIA PROCESSING LAYER
```

e:

```text
PRESENTATION LAYER
```

Arquitetura:

```text
Next.js
     │
     ↓
AI / Agent Layer
     │
     ↓
Job Orchestration
     │
     ↓
Media Processing Workers
     │
     ↓
Storage
```

Não misturar os três.

---

# 52. TARGET RESULT

O resultado final deve parecer ter sido produzido por uma equipe profissional de:

* editor;
* colorista;
* motion designer;
* compositor VFX;
* sound designer;
* técnico de áudio;
* finishing artist.

Porém, o usuário deve interagir principalmente através de linguagem natural.

O usuário não precisa saber:

* máscaras;
* tracking;
* codecs;
* FFmpeg;
* segmentation;
* optical flow;
* color spaces;
* DSP;
* GPU;
* rendering.

Ele apenas descreve o resultado desejado.

O sistema traduz isso em operações técnicas.

---

# 53. EXEMPLO COMPLETO

Entrada:

> "No primeiro vídeo, remova o homem que aparece atrás de mim dos 12 aos 18 segundos. Não altere minha aparência. Clareie meu rosto um pouco, mas preserve a textura da pele. Diminua o brilho do céu. Minha voz está com muito ruído, então limpe somente minha voz. Depois faça uma transição cinematográfica para o segundo vídeo, usando o movimento da câmera para que pareça que foi gravado como uma única tomada."

Sistema:

```text
DIRECTOR
 ↓
VIDEO ANALYSIS
 ↓
SCENE DETECTION
 ↓
OBJECT REGISTRY
 ↓
Person_03 identified
 ↓
TRACKING
 ↓
MASK
 ↓
OBJECT REMOVAL
 ↓
FACE SEGMENTATION
 ↓
LOCAL LIGHTING
 ↓
SKIN PRESERVATION
 ↓
SKY MASK
 ↓
LOCAL COLOR GRADE
 ↓
AUDIO DIARIZATION
 ↓
VOICE ISOLATION
 ↓
NOISE REDUCTION
 ↓
CLIP A / CLIP B ANALYSIS
 ↓
CAMERA MOTION ANALYSIS
 ↓
TRANSITION GENERATION
 ↓
COMPOSITE
 ↓
TEMPORAL QA
 ↓
AUDIO QA
 ↓
VISUAL QA
 ↓
FINAL RENDER
```

---

# 54. PRINCÍPIO FINAL DO PRODUTO

A regra fundamental do projeto é:

> **Understand globally. Plan semantically. Track temporally. Process selectively. Composite non-destructively. Render efficiently. Verify automatically.**

O sistema deve compreender o vídeo inteiro para tomar decisões corretas, mas nunca desperdiçar processamento editando partes que não precisam ser modificadas.

O resultado deve preservar o máximo possível do material original e aplicar alterações exclusivamente onde solicitado.

---

# 55. IMPLEMENTAÇÃO

Não crie apenas mockups.

Construa uma arquitetura funcional e incremental.

Primeiro implemente:

```text
Upload
 ↓
Asset ingestion
 ↓
Proxy generation
 ↓
Video metadata
 ↓
Scene detection
 ↓
Object detection
 ↓
Timeline
 ↓
Natural-language command
 ↓
Director Agent
 ↓
EditPlan
 ↓
Job Queue
 ↓
One real VFX operation
 ↓
Preview
 ↓
Render
 ↓
QA
```

Depois expandir para:

```text
tracking
segmentation
object removal
color
lighting
audio
transitions
advanced VFX
```

Toda funcionalidade deve possuir:

* TypeScript types;
* Zod schema;
* API;
* agent tool;
* worker implementation;
* job tracking;
* progress reporting;
* error handling;
* caching;
* QA;
* UI representation.

Não criar funcionalidades fictícias ou botões que não possuem implementação.

Priorizar uma fundação sólida de processamento de mídia e uma arquitetura de agentes extensível em vez de tentar implementar dezenas de efeitos superficialmente.

O objetivo final é criar um **sistema de pós-produção audiovisual autônomo, não destrutivo, orientado por agentes e capaz de executar edição profissional sobre vídeos existentes mantendo controle temporal, espacial, visual e sonoro em nível de frame/região.**
