import type { Language } from './translationService';

export interface HelpSyntaxElement {
  title: string;
  example: string;
  desc: string;
}

export interface HelpStep {
  title: string;
  desc: string;
}

export interface HelpHotkey {
  keys: string;
  desc: string;
}

export interface HelpContent {
  syntaxTitle: string;
  syntaxIntroduction: string;
  sampleLineTitle: string;
  syntaxElementsTitle: string;
  elements: HelpSyntaxElement[];
  
  syncTitle: string;
  syncIntroduction: string;
  steps: HelpStep[];
  
  hotkeysTitle: string;
  hotkeyList: HelpHotkey[];
}

export const helpTranslations: Record<Language, HelpContent> = {
  de: {
    syntaxTitle: 'Was ist das todo.txt Format?',
    syntaxIntroduction: 'Das todo.txt-Format ist ein einfaches, menschlich lesbares Dateiformat für Aufgabenlisten. Jede Zeile in der Datei entspricht genau einer Aufgabe. Durch Einhaltung einfacher Syntax-Regeln erkennt die App Prioritäten, Projekte, Kontexte und weitere Metadaten.',
    sampleLineTitle: 'Beispiel-Zeile:',
    syntaxElementsTitle: 'Die Syntax-Elemente',
    elements: [
      { title: 'Priorität', example: '(A), (B), (C) ...', desc: 'Ein Großbuchstabe in Klammern ganz am Anfang der Zeile setzt die Priorität.' },
      { title: 'Erstellungsdatum', example: 'YYYY-MM-DD', desc: 'Ein optionales Datum direkt nach der Priorität setzt das Erstellungsdatum.' },
      { title: 'Kontext', example: '@supermarkt', desc: 'Ein Wort mit einem @-Symbol kennzeichnet den Ort oder die Situation.' },
      { title: 'Projekt', example: '+wochenende', desc: 'Ein Wort mit einem +-Symbol ordnet die Aufgabe einer Liste oder einem Projekt zu.' },
      { title: 'Fälligkeitsdatum', example: 'due:YYYY-MM-DD', desc: 'Legt fest, bis wann die Aufgabe erledigt sein muss.' },
      { title: 'Startdatum', example: 't:YYYY-MM-DD', desc: 'Schwellenwert. Blendet Aufgaben aus, bis dieses Startdatum erreicht ist.' },
      { title: 'Wiederholung', example: 'rec:1d, rec:+1w', desc: 'Automatische Erstellung einer Folgeaufgabe (d: Tage, w: Wochen, m: Monate).' },
      { title: 'Zuständigkeit', example: 'who:name', desc: 'Ordnet die Aufgabe einer Person zu (z.B. who:cornelius).' }
    ],
    syncTitle: 'Wie funktioniert die Synchronisation?',
    syncIntroduction: 'Die App kann deine Aufgabenliste direkt in deiner Microsoft OneDrive Cloud speichern. So bleibt deine todo.txt-Datei auf all deinen Geräten synchron.',
    steps: [
      { title: '1. OneDrive verbinden', desc: 'Melde dich mit deinem Microsoft-Konto an. Die Verbindung erfolgt sicher über OAuth2.' },
      { title: '2. Datei auswählen', desc: 'Wähle eine vorhandene todo.txt-Datei aus oder erstelle eine neue direkt in deinem OneDrive.' },
      { title: '3. Automatische Speicherung', desc: 'Jede Änderung wird sofort in die Cloud übertragen. Bei Offline-Nutzung wird synchronisiert, sobald du wieder online bist.' }
    ],
    hotkeysTitle: 'Tastatur-Kurzbefehle',
    hotkeyList: [
      { keys: '?', desc: 'Hilfe-Modal öffnen / schließen' },
      { keys: 'N / I', desc: 'Aufgabeneingabe fokussieren' },
      { keys: 'Esc', desc: 'Fenster oder Eingabe schließen' },
      { keys: 'Ctrl + Z / U', desc: 'Letzte Aktion rückgängig machen' },
      { keys: 'A', desc: 'Erledigte Aufgaben archivieren' },
      { keys: '1 - 9', desc: 'Smart-Ansichten wechseln' },
      { keys: 'S', desc: 'Suchfeld fokussieren' },
      { keys: 'C', desc: 'Farbschema (Hell/Dunkel) wechseln' },
      { keys: 'D', desc: 'Designdichte umschalten' },
      { keys: 'K', desc: 'Zwischen Liste und Kanban wechseln' }
    ]
  },
  en: {
    syntaxTitle: 'What is the todo.txt format?',
    syntaxIntroduction: 'The todo.txt format is a simple, human-readable file format for task lists. Each line corresponds to exactly one task. By following simple syntax rules, the app recognizes priorities, projects, contexts, and other metadata.',
    sampleLineTitle: 'Example Line:',
    syntaxElementsTitle: 'Syntax Elements',
    elements: [
      { title: 'Priority', example: '(A), (B), (C) ...', desc: 'A capital letter in parentheses at the very beginning sets the priority.' },
      { title: 'Creation Date', example: 'YYYY-MM-DD', desc: 'An optional date right after priority sets the creation date.' },
      { title: 'Context', example: '@supermarket', desc: 'A word starting with @ tags a location, tool, or situation.' },
      { title: 'Project', example: '+weekend', desc: 'A word starting with + tags a project or category.' },
      { title: 'Due Date', example: 'due:YYYY-MM-DD', desc: 'Specifies when the task must be completed.' },
      { title: 'Start Date', example: 't:YYYY-MM-DD', desc: 'Threshold date. Hides the task until this date is reached.' },
      { title: 'Recurrence', example: 'rec:1d, rec:+1w', desc: 'Automatically recreates tasks upon completion (d: days, w: weeks, m: months).' },
      { title: 'Assignee', example: 'who:name', desc: 'Assigns the task to a person (e.g., who:cornelius).' }
    ],
    syncTitle: 'How does the synchronization work?',
    syncIntroduction: 'The app can store your task list directly in your Microsoft OneDrive cloud. This keeps your todo.txt file synchronized across all your devices.',
    steps: [
      { title: '1. Connect OneDrive', desc: 'Log in with your Microsoft account. The connection is secure via OAuth2.' },
      { title: '2. Select File', desc: 'Choose an existing todo.txt file or create a new one directly in your OneDrive.' },
      { title: '3. Auto Save', desc: 'Every change is immediately uploaded. If offline, changes sync as soon as you reconnect.' }
    ],
    hotkeysTitle: 'Keyboard Shortcuts',
    hotkeyList: [
      { keys: '?', desc: 'Open / close help modal' },
      { keys: 'N / I', desc: 'Focus task input field' },
      { keys: 'Esc', desc: 'Close modals or active input' },
      { keys: 'Ctrl + Z / U', desc: 'Undo the last action' },
      { keys: 'A', desc: 'Archive completed tasks' },
      { keys: '1 - 9', desc: 'Switch smart list views' },
      { keys: 'S', desc: 'Focus search bar' },
      { keys: 'C', desc: 'Toggle light / dark theme' },
      { keys: 'D', desc: 'Switch design density' },
      { keys: 'K', desc: 'Toggle list / Kanban board view' }
    ]
  },
  la: {
    syntaxTitle: 'Quid est forma todo.txt?',
    syntaxIntroduction: 'Forma todo.txt est simplex et hominibus legibilis descriptio pensorum. Unaquaeque linea unum pensum indicat. Reguliss simplicibus servatis, haec applicatio prioritatem, proiecta, contextus, et alia nota invenit.',
    sampleLineTitle: 'Exemplum lineae:',
    syntaxElementsTitle: 'Elementa Syntaxis',
    elements: [
      { title: 'Prioritas', example: '(A), (B), (C) ...', desc: 'Littera magna in parenthesi in principio lineae prioritatem ponit.' },
      { title: 'Dies Creationis', example: 'YYYY-MM-DD', desc: 'Dies optionis post prioritatem scribitur ad diem initii indicandum.' },
      { title: 'Contextus', example: '@supermercatus', desc: 'Vocabulum cum symbolo @ locum aut modum designat.' },
      { title: 'Proiectum', example: '+fine_septimanae', desc: 'Vocabulum cum symbolo + pensum proiecto attribuit.' },
      { title: 'Dies Finitus', example: 'due:YYYY-MM-DD', desc: 'Dies demonstrans quando pensum conficiendum sit.' },
      { title: 'Dies Initii', example: 't:YYYY-MM-DD', desc: 'Limen temporis. Pensum celat usque ad hunc diem.' },
      { title: 'Repetitio', example: 'rec:1d, rec:+1w', desc: 'Rursus creat pensum confectum (d: dies, w: septimanae, m: menses).' },
      { title: 'Curator', example: 'who:nomen', desc: 'Pensum alicui personae attribuit (e.g. who:cornelius).' }
    ],
    syncTitle: 'Quomodo synchronizatio operatur?',
    syncIntroduction: 'Haec applicatio catalogum pensorum tuorum in Microsoft OneDrive nube servare potest. Ita scrinium todo.txt in omnibus machinis tuis synchronum manet.',
    steps: [
      { title: '1. Iungere OneDrive', desc: 'Inscribe nomen per Microsoft rationem. Connexio secura per OAuth2 fit.' },
      { title: '2. Eligere Scrinium', desc: 'Elige scrinium todo.txt existens aut crea novum in OneDrive tuo.' },
      { title: '3. Automatica Conservatio', desc: 'Omnis mutatio statim in nubem mittitur. Si es sine linea, synchronizabitur cum redieris.' }
    ],
    hotkeysTitle: 'Brevia Claviaturae',
    hotkeyList: [
      { keys: '?', desc: 'Aperire / claudere auxilium' },
      { keys: 'N / I', desc: 'Intrare in pensum addendum' },
      { keys: 'Esc', desc: 'Claudere fenestram activam' },
      { keys: 'Ctrl + Z / U', desc: 'Ultimam actionem revertere' },
      { keys: 'A', desc: 'Archivare pensa completa' },
      { keys: '1 - 9', desc: 'Mutare visus indices' },
      { keys: 'S', desc: 'Intrare in inquisitionem' },
      { keys: 'C', desc: 'Mutare thema inter lucidum/obscurum' },
      { keys: 'D', desc: 'Mutare spissitudinem layout' },
      { keys: 'K', desc: 'Mutare inter listam et Kanban' }
    ]
  },
  fr: {
    syntaxTitle: 'Qu\'est-ce que le format todo.txt ?',
    syntaxIntroduction: 'Le format todo.txt est un format de fichier simple et lisible par l\'homme pour les listes de tâches. Chaque ligne correspond exactement à une tâche. En suivant des règles de syntaxe simples, l\'application identifie les priorités, les projets, les contextes et d\'autres métadonnées.',
    sampleLineTitle: 'Exemple de ligne :',
    syntaxElementsTitle: 'Éléments de syntaxe',
    elements: [
      { title: 'Priorité', example: '(A), (B), (C) ...', desc: 'Une lettre majuscule entre parenthèses au tout début définit la priorité.' },
      { title: 'Date de Création', example: 'YYYY-MM-DD', desc: 'Une date facultative juste après la priorité définit la date de création.' },
      { title: 'Contexte', example: '@supermarche', desc: 'Un mot commençant par @ identifie un lieu ou une situation.' },
      { title: 'Projet', example: '+weekend', desc: 'Un mot commençant par + associe la tâche à un projet ou une liste.' },
      { title: 'Échéance', example: 'due:YYYY-MM-DD', desc: 'Définit la date à laquelle la tâche doit être terminée.' },
      { title: 'Date de Début', example: 't:YYYY-MM-DD', desc: 'Seuil d\'affichage. Masque la tâche jusqu\'à cette date.' },
      { title: 'Récurrence', example: 'rec:1d, rec:+1w', desc: 'Création automatique d\'une tâche répétitive (d : jours, w : semaines, m : mois).' },
      { title: 'Responsable', example: 'who:nom', desc: 'Assigne la tâche à une personne spécifique (ex. who:cornelius).' }
    ],
    syncTitle: 'Comment fonctionne la synchronisation ?',
    syncIntroduction: 'L\'application peut stocker votre liste de tâches directement sur votre espace cloud Microsoft OneDrive, ce qui permet de garder votre fichier todo.txt synchronisé sur tous vos appareils.',
    steps: [
      { title: '1. Connecter OneDrive', desc: 'Connectez-vous avec votre compte Microsoft. La connexion est sécurisée via OAuth2.' },
      { title: '2. Choisir le fichier', desc: 'Sélectionnez un fichier todo.txt existant ou créez-en un nouveau directement sur votre OneDrive.' },
      { title: '3. Sauvegarde automatique', desc: 'Chaque modification est immédiatement synchronisée. En mode hors ligne, la sync s\'effectue dès le retour d\'une connexion.' }
    ],
    hotkeysTitle: 'Raccourcis Clavier',
    hotkeyList: [
      { keys: '?', desc: 'Ouvrir / fermer la boîte d\'aide' },
      { keys: 'N / I', desc: 'Placer le curseur sur la saisie de tâche' },
      { keys: 'Esc', desc: 'Fermer les fenêtres modales ou la saisie' },
      { keys: 'Ctrl + Z / U', desc: 'Annuler la dernière action' },
      { keys: 'A', desc: 'Archiver les tâches terminées' },
      { keys: '1 - 9', desc: 'Changer de liste intelligente' },
      { keys: 'S', desc: 'Placer le curseur sur la recherche' },
      { keys: 'C', desc: 'Basculer le thème (clair / sombre)' },
      { keys: 'D', desc: 'Changer la densité d\'affichage' },
      { keys: 'K', desc: 'Basculer entre liste et tableau Kanban' }
    ]
  },
  it: {
    syntaxTitle: 'Cos\'è il formato todo.txt?',
    syntaxIntroduction: 'Il formato todo.txt è un formato di file di testo semplice e leggibile per le liste di cose da fare. Ogni riga corrisponde a un compito. Seguendo regole sintattiche elementari, l\'applicazione riconosce priorità, progetti, contesti e altri metadati.',
    sampleLineTitle: 'Esempio di riga:',
    syntaxElementsTitle: 'Elementi della Sintassi',
    elements: [
      { title: 'Priorità', example: '(A), (B), (C) ...', desc: 'Una lettera maiuscola tra parentesi all\'inizio della riga imposta la priorità.' },
      { title: 'Data Creazione', example: 'YYYY-MM-DD', desc: 'Una data opzionale subito dopo la priorità imposta la data di creazione.' },
      { title: 'Contesto', example: '@supermercato', desc: 'Una parola che inizia con @ tagga un luogo o una situazione.' },
      { title: 'Progetto', example: '+weekend', desc: 'Una parola che inizia con + associa il compito a un progetto.' },
      { title: 'Scadenza', example: 'due:YYYY-MM-DD', desc: 'Indica entro quando completare il compito.' },
      { title: 'Data d\'inizio', example: 't:YYYY-MM-DD', desc: 'Data di soglia. Nasconde il compito fino a quel giorno.' },
      { title: 'Ricorrenza', example: 'rec:1d, rec:+1w', desc: 'Ricrea automaticamente il compito al completamento (d: giorni, w: settimane, m: mesi).' },
      { title: 'Assegnatario', example: 'who:nome', desc: 'Assegna il compito a una persona (es. who:cornelius).' }
    ],
    syncTitle: 'Come funziona la sincronizzazione?',
    syncIntroduction: 'L\'applicazione può salvare la tua lista di compiti direttamente sul tuo cloud Microsoft OneDrive, mantenendo il file todo.txt sincronizzato su tutti i dispositivi.',
    steps: [
      { title: '1. Connetti OneDrive', desc: 'Accedi con il tuo account Microsoft. La connessione è protetta tramite OAuth2.' },
      { title: '2. Seleziona File', desc: 'Scegli un file todo.txt esistente o creane uno nuovo direttamente su OneDrive.' },
      { title: '3. Salvataggio Automatico', desc: 'Ogni modifica viene caricata istantaneamente. Se offline, si sincronizzerà appena torni online.' }
    ],
    hotkeysTitle: 'Scorciatoie da Tastiera',
    hotkeyList: [
      { keys: '?', desc: 'Apri / chiudi la finestra d\'aiuto' },
      { keys: 'N / I', desc: 'Sposta il focus sull\'inserimento compito' },
      { keys: 'Esc', desc: 'Chiudi finestre modali o input attivo' },
      { keys: 'Ctrl + Z / U', desc: 'Annulla l\'ultima azione' },
      { keys: 'A', desc: 'Archivia i compiti completati' },
      { keys: '1 - 9', desc: 'Cambia vista lista intelligente' },
      { keys: 'S', desc: 'Sposta il focus sulla barra di ricerca' },
      { keys: 'C', desc: 'Cambia tema (chiaro / scuro)' },
      { keys: 'D', desc: 'Cambia la densità del layout' },
      { keys: 'K', desc: 'Cambia tra vista a lista e Kanban' }
    ]
  },
  es: {
    syntaxTitle: '¿Qué es el formato todo.txt?',
    syntaxIntroduction: 'El formato todo.txt es un formato de archivo simple y legible por humanos para listas de tareas. Cada línea equivale a una tarea. Siguiendo unas sencillas reglas sintácticas, la aplicación reconoce prioridades, proyectos, contextos y otros metadatos.',
    sampleLineTitle: 'Línea de ejemplo:',
    syntaxElementsTitle: 'Elementos de sintaxis',
    elements: [
      { title: 'Prioridad', example: '(A), (B), (C) ...', desc: 'Una letra mayúscula entre paréntesis al inicio de la línea define la prioridad.' },
      { title: 'Fecha de Creación', example: 'YYYY-MM-DD', desc: 'Una fecha opcional justo después de la prioridad define la fecha de creación.' },
      { title: 'Contexto', example: '@supermercado', desc: 'Una palabra que empieza por @ etiqueta un lugar, herramienta o situación.' },
      { title: 'Proyecto', example: '+fin_de_semana', desc: 'Una palabra que empieza por + asocia la tarea a un proyecto o categoría.' },
      { title: 'Vencimiento', example: 'due:YYYY-MM-DD', desc: 'Especifica la fecha límite para completar la tarea.' },
      { title: 'Fecha de Inicio', example: 't:YYYY-MM-DD', desc: 'Umbral de inicio. Oculta la tarea hasta esta fecha.' },
      { title: 'Recurrencia', example: 'rec:1d, rec:+1w', desc: 'Vuelve a crear la tarea automáticamente al completarla (d: días, w: semanas, m: meses).' },
      { title: 'Asignado', example: 'who:nombre', desc: 'Asigna la tarea a una persona específica (ej. who:cornelius).' }
    ],
    syncTitle: '¿Cómo funciona la sincronización?',
    syncIntroduction: 'La aplicación puede guardar tu lista de tareas directamente en tu cuenta de Microsoft OneDrive. De esta forma, tu archivo todo.txt permanece sincronizado en todos tus dispositivos.',
    steps: [
      { title: '1. Conectar OneDrive', desc: 'Inicia sesión con tu cuenta de Microsoft. La conexión es segura mediante OAuth2.' },
      { title: '2. Seleccionar archivo', desc: 'Elige un archivo todo.txt existente o crea uno nuevo en tu cuenta de OneDrive.' },
      { title: '3. Guardado automático', desc: 'Cualquier cambio se sube inmediatamente. Si estás sin conexión, se sincronizará cuando vuelvas a conectarte.' }
    ],
    hotkeysTitle: 'Atajos de Teclado',
    hotkeyList: [
      { keys: '?', desc: 'Abrir / cerrar el menú de ayuda' },
      { keys: 'N / I', desc: 'Enfocar el campo de entrada de tareas' },
      { keys: 'Esc', desc: 'Cerrar ventanas emergentes o entradas activas' },
      { keys: 'Ctrl + Z / U', desc: 'Deshacer la última acción' },
      { keys: 'A', desc: 'Archivar las tareas completadas' },
      { keys: '1 - 9', desc: 'Cambiar de lista inteligente' },
      { keys: 'S', desc: 'Enfocar la barra de búsqueda' },
      { keys: 'C', desc: 'Cambiar tema (claro / oscuro)' },
      { keys: 'D', desc: 'Cambiar densidad del diseño' },
      { keys: 'K', desc: 'Alternar entre vista de lista y Kanban' }
    ]
  },
  zh: {
    syntaxTitle: '什么是 todo.txt 格式？',
    syntaxIntroduction: 'todo.txt 格式是一种简单易读的任务列表文件格式。文件中的每一行都代表一项任务。通过简单的语法规则，应用程序即可识别优先级、项目、情境以及其他元数据。',
    sampleLineTitle: '示例任务行：',
    syntaxElementsTitle: '语法元素说明',
    elements: [
      { title: '优先级', example: '(A), (B), (C) ...', desc: '行首用括号括起的大写字母表示该任务的优先级。' },
      { title: '创建日期', example: 'YYYY-MM-DD', desc: '紧跟在优先级后面的可选日期，用于指定任务创建的时间。' },
      { title: '情境 (Context)', example: '@supermarket', desc: '以 @ 开头的一个单词，代表任务进行的地点、工具或情境。' },
      { title: '项目 (Project)', example: '+weekend', desc: '以 + 开头的一个单词，用于把任务归类到特定项目或列表中。' },
      { title: '截止日期', example: 'due:YYYY-MM-DD', desc: '指定任务必须完成的时间限制。' },
      { title: '开始日期', example: 't:YYYY-MM-DD', desc: '开始时间阈值。在此日期之前，该任务会被自动隐藏。' },
      { title: '重复周期', example: 'rec:1d, rec:+1w', desc: '在任务完成后自动生成后续任务（d: 天，w: 周，m: 月）。' },
      { title: '指派人', example: 'who:name', desc: '把任务指派给特定的人（例如 who:cornelius）。' }
    ],
    syncTitle: '云端同步如何工作？',
    syncIntroduction: '本应用可以将您的任务列表文件直接保存在 Microsoft OneDrive 云盘中。由此可以保持您的 todo.txt 文件在所有设备上实时同步。',
    steps: [
      { title: '1. 连接 OneDrive', desc: '使用您的 Microsoft 账户登录。通过安全的 OAuth2 协议连接。' },
      { title: '2. 选择文件', desc: '从您的 OneDrive 中选择一个已有的 todo.txt 文件，或者直接在云端新建一个。' },
      { title: '3. 自动保存', desc: '每一次修改都会立即同步到云盘。如果离线，重新连网后更改会自动同步。' }
    ],
    hotkeysTitle: '键盘快捷键列表',
    hotkeyList: [
      { keys: '?', desc: '打开 / 关闭帮助说明窗口' },
      { keys: 'N / I', desc: '聚焦到任务输入框' },
      { keys: 'Esc', desc: '关闭弹窗或取消当前输入' },
      { keys: 'Ctrl + Z / U', desc: '撤销上一次的任务操作' },
      { keys: 'A', desc: '将已完成的任务移入归档' },
      { keys: '1 - 9', desc: '切换不同的智能列表视图' },
      { keys: 'S', desc: '聚焦搜索框' },
      { keys: 'C', desc: '切换浅色 / 深色主题界面' },
      { keys: 'D', desc: '切换界面的设计紧凑度' },
      { keys: 'K', desc: '在任务列表与看板视图之间切换' }
    ]
  },
  ar: {
    syntaxTitle: 'ما هو تنسيق todo.txt؟',
    syntaxIntroduction: 'تنسيق todo.txt هو تنسيق ملفات بسيط وسهل القراءة لتنظيم المهام. يمثل كل سطر في الملف مهمة واحدة. باتباع قواعد كتابة بسيطة، يتعرف التطبيق على الأولويات والمشاريع والسياقات وغيرها من البيانات.',
    sampleLineTitle: 'سطر توضيحي:',
    syntaxElementsTitle: 'عناصر الصيغة',
    elements: [
      { title: 'الأولوية', example: '(A), (B), (C) ...', desc: 'حرف كبير بين قوسين في بداية السطر يحدد أولوية المهمة.' },
      { title: 'تاريخ الإنشاء', example: 'YYYY-MM-DD', desc: 'تاريخ اختياري مباشرة بعد الأولوية يحدد تاريخ إنشاء المهمة.' },
      { title: 'السياق', example: '@supermarket', desc: 'كلمة تبدأ بعلامة @ تحدد المكان أو الأداة أو الموقف.' },
      { title: 'المشروع', example: '+weekend', desc: 'كلمة تبدأ بعلامة + تنسب المهمة لمشروع أو تصنيف محدد.' },
      { title: 'تاريخ الاستحقاق', example: 'due:YYYY-MM-DD', desc: 'يحدد الموعد النهائي الذي يجب إكمال المهمة فيه.' },
      { title: 'تاريخ البدء', example: 't:YYYY-MM-DD', desc: 'تاريخ الحد الأدنى للبدء. يخفي المهمة حتى يحين هذا التاريخ.' },
      { title: 'التكرار', example: 'rec:1d, rec:+1w', desc: 'إعادة إنشاء المهمة تلقائياً عند إكمالها (d: أيام، w: أسابيع، m: شهور).' },
      { title: 'المسؤول', example: 'who:name', desc: 'يسند المهمة لشخص معين (مثل who:cornelius).' }
    ],
    syncTitle: 'كيف تعمل المزامنة؟',
    syncIntroduction: 'يمكن للتطبيق حفظ قائمة مهامك مباشرة في حسابك على Microsoft OneDrive. يتيح ذلك إبقاء ملف todo.txt متزامناً عبر جميع أجهزتك.',
    steps: [
      { title: '1. ربط OneDrive', desc: 'قم بتسجيل الدخول باستخدام حساب مايكروسوفت الخاص بك. يتم الاتصال بأمان عبر OAuth2.' },
      { title: '2. اختيار الملف', desc: 'اختر ملف todo.txt موجود مسبقاً أو أنشئ ملفاً جديداً مباشرة في OneDrive الخاص بك.' },
      { title: '3. الحفظ التلقائي', desc: 'يتم رفع أي تغيير على الفور. إذا كنت غير متصل بالإنترنت، فستتم المزامنة بمجرد استعادة الاتصال.' }
    ],
    hotkeysTitle: 'اختصارات لوحة المفاتيح',
    hotkeyList: [
      { keys: '?', desc: 'فتح / إغلاق نافذة المساعدة' },
      { keys: 'N / I', desc: 'التركيز على حقل إدخال المهام' },
      { keys: 'Esc', desc: 'إغلاق النوافذ المنبثقة أو المدخلات النشطة' },
      { keys: 'Ctrl + Z / U', desc: 'التراجع عن الإجراء الأخير' },
      { keys: 'A', desc: 'أرشفة المهام المكتملة' },
      { keys: '1 - 9', desc: 'التبديل بين عروض القوائم الذكية' },
      { keys: 'S', desc: 'التركيز على شريط البحث' },
      { keys: 'C', desc: 'تبديل سمة المظهر (فاتح / داكن)' },
      { keys: 'D', desc: 'تبديل كثافة التصميم' },
      { keys: 'K', desc: 'التبديل بين عرض القائمة وعرض لوحة كانبان' }
    ]
  },
  hi: {
    syntaxTitle: 'todo.txt प्रारूप क्या है?',
    syntaxIntroduction: 'todo.txt प्रारूप कार्य सूचियों के लिए एक सरल, इंसानों द्वारा पढ़ा जाने वाला फ़ाइल प्रारूप है। प्रत्येक पंक्ति ठीक एक कार्य से मेल खाती है। सरल सिंटैक्स नियमों का पालन करके, ऐप प्राथमिकताओं, परियोजनाओं, संदर्भों और अन्य मेटाडेटा को पहचानता है।',
    sampleLineTitle: 'उदाहरण पंक्ति:',
    syntaxElementsTitle: 'सिंटैक्स तत्व',
    elements: [
      { title: 'प्राथमिकता', example: '(A), (B), (C) ...', desc: 'पंक्ति की शुरुआत में कोष्ठक में एक बड़ा अक्षर प्राथमिकता निर्धारित करता है।' },
      { title: 'निर्माण तिथि', example: 'YYYY-MM-DD', desc: 'प्राथमिकता के ठीक बाद एक वैकल्पिक तिथि निर्माण तिथि निर्धारित करती है।' },
      { title: 'संदर्भ', example: '@supermarket', desc: '@ से शुरू होने वाला शब्द किसी स्थान, उपकरण या स्थिति को दर्शाता है।' },
      { title: 'परियोजना', example: '+weekend', desc: '+ से शुरू होने वाला शब्द किसी परियोजना या श्रेणी को दर्शाता है।' },
      { title: 'नियत तिथि', example: 'due:YYYY-MM-DD', desc: 'यह निर्दिष्ट करता है कि कार्य कब तक पूरा किया जाना चाहिए।' },
      { title: 'आरंभ तिथि', example: 't:YYYY-MM-DD', desc: 'आरंभ तिथि सीमा। कार्य को इस तिथि तक छुपाता है।' },
      { title: 'पुनरावृत्ति', example: 'rec:1d, rec:+1w', desc: 'पूरा होने पर स्वचालित रूप से कार्य बनाता है (d: दिन, w: सप्ताह, m: महीने)।' },
      { title: 'सौंपा गया व्यक्ति', example: 'who:name', desc: 'कार्य को किसी व्यक्ति को सौंपता है (जैसे, who:cornelius)।' }
    ],
    syncTitle: 'सिंक्रनाइज़ेशन कैसे काम करता है?',
    syncIntroduction: 'ऐप आपकी कार्य सूची को सीधे आपके Microsoft OneDrive क्लाउड में सहेज सकता है। इससे आपकी todo.txt फ़ाइल आपके सभी उपकरणों पर सिंक रहती है।',
    steps: [
      { title: '1. OneDrive कनेक्ट करें', desc: 'अपने Microsoft खाते से लॉग इन करें। कनेक्शन OAuth2 के माध्यम से सुरक्षित है।' },
      { title: '2. फ़ाइल चुनें', desc: 'एक मौजूदा todo.txt फ़ाइल चुनें या अपने OneDrive में सीधे एक नई फ़ाइल बनाएं।' },
      { title: '3. ऑटो सेव', desc: 'हर बदलाव तुरंत अपलोड हो जाता है। ऑफ़लाइन होने पर, ऑनलाइन आते ही बदलाव सिंक हो जाते हैं।' }
    ],
    hotkeysTitle: 'कीबोर्ड शॉर्टकट',
    hotkeyList: [
      { keys: '?', desc: 'सहायता विंडो खोलें / बंद करें' },
      { keys: 'N / I', desc: 'कार्य इनपुट फ़ील्ड पर ध्यान केंद्रित करें' },
      { keys: 'Esc', desc: 'पॉपअप या सक्रिय इनपुट बंद करें' },
      { keys: 'Ctrl + Z / U', desc: 'पिछली क्रिया को पूर्ववत करें' },
      { keys: 'A', desc: 'पूरे हो चुके कार्यों को संग्रहीत करें' },
      { keys: '1 - 9', desc: 'स्मार्ट सूची दृश्य बदलें' },
      { keys: 'S', desc: 'खोज बार पर ध्यान केंद्रित करें' },
      { keys: 'C', desc: 'लाइट / डार्क थीम बदलें' },
      { keys: 'D', desc: 'डिज़ाइन घनत्व बदलें' },
      { keys: 'K', desc: 'सूची और कानबान बोर्ड दृश्य के बीच स्विच करें' }
    ]
  },
  pt: {
    syntaxTitle: 'O que é o formato todo.txt?',
    syntaxIntroduction: 'O formato todo.txt é um formato de arquivo simples e legível por humanos para listas de tarefas. Cada linha corresponde a exatamente uma tarefa. Ao seguir regras de sintaxe simples, a aplicação reconhece prioridades, projetos, contextos e outros metadados.',
    sampleLineTitle: 'Linha de Exemplo:',
    syntaxElementsTitle: 'Elementos de Sintaxe',
    elements: [
      { title: 'Prioridade', example: '(A), (B), (C) ...', desc: 'Uma letra maiúscula entre parênteses no início da linha define a prioridade.' },
      { title: 'Data de Criação', example: 'YYYY-MM-DD', desc: 'Uma data opcional logo após a prioridade define a data de criação.' },
      { title: 'Contexto', example: '@supermercado', desc: 'Uma palavra que começa com @ identifica um local, ferramenta ou situação.' },
      { title: 'Projeto', example: '+fim_de_semana', desc: 'Uma palavra que começa com + associa a tarefa a um projeto ou categoria.' },
      { title: 'Vencimento', example: 'due:YYYY-MM-DD', desc: 'Especifica a data limite para conclusão da tarefa.' },
      { title: 'Data de Início', example: 't:YYYY-MM-DD', desc: 'Limite de início. Oculta a tarefa até que esta data seja alcançada.' },
      { title: 'Recorrência', example: 'rec:1d, rec:+1w', desc: 'Recria automaticamente a tarefa ao ser concluída (d: dias, w: semanas, m: meses).' },
      { title: 'Responsável', example: 'who:nome', desc: 'Atribui a tarefa a uma pessoa (ex. who:cornelius).' }
    ],
    syncTitle: 'Como funciona a sincronização?',
    syncIntroduction: 'A aplicação pode armazenar a sua lista de tarefas diretamente na sua conta do Microsoft OneDrive. Isso mantém o seu arquivo todo.txt sincronizado em todos os seus aparelhos.',
    steps: [
      { title: '1. Conectar OneDrive', desc: 'Faça login com a sua conta da Microsoft. A conexão é segura via OAuth2.' },
      { title: '2. Selecionar Arquivo', desc: 'Escolha um arquivo todo.txt existente ou crie um novo diretamente no seu OneDrive.' },
      { title: '3. Salvamento Automático', desc: 'Qualquer alteração é imediatamente enviada. Se offline, a sincronização ocorre assim que retornar a conexão.' }
    ],
    hotkeysTitle: 'Atalhos do Teclado',
    hotkeyList: [
      { keys: '?', desc: 'Abrir / fechar painel de ajuda' },
      { keys: 'N / I', desc: 'Focar no campo de entrada de tarefa' },
      { keys: 'Esc', desc: 'Fechar janelas modais ou entrada ativa' },
      { keys: 'Ctrl + Z / U', desc: 'Desfazer a última ação' },
      { keys: 'A', desc: 'Arquivar tarefas concluídas' },
      { keys: '1 - 9', desc: 'Alternar entre visualizações de listas inteligentes' },
      { keys: 'S', desc: 'Focar na barra de busca' },
      { keys: 'C', desc: 'Alternar entre tema claro / escuro' },
      { keys: 'D', desc: 'Alterar a densidade do design' },
      { keys: 'K', desc: 'Alternar entre visualização de lista e Kanban' }
    ]
  },
  sw: {
    syntaxTitle: 'Was isch des todo.txt Format?',
    syntaxIntroduction: 'Des todo.txt-Format isch a eifachs Dateiformat für dei Uffgabalischd, wo ma ganz leicht leasa ka. Jede Zeil in der Datei isch genau oine Uffgab. Wenn ma a paar eifache Regla eihält, erkennt d\'App Prioritäte, Projekte, Kontexte und so weiter von selbscht.',
    sampleLineTitle: 'Beischbiel-Zeil:',
    syntaxElementsTitle: 'D\'Syntax-Elemente',
    elements: [
      { title: 'Priorität', example: '(A), (B), (C) ...', desc: 'A großer Buchschdab in Klammer ganz am Anfang setzt die Priorität.' },
      { title: 'Erstellung', example: 'YYYY-MM-DD', desc: 'A Datum direkt nach der Priorität setzt dei Erstelldatum.' },
      { title: 'Kontext', example: '@supermarkt', desc: 'A Wort mit @ zeigt, wo oder in welcher Lage ma des macht.' },
      { title: 'Projekt', example: '+wochenend', desc: 'A Wort mit + sortiert die Uffgab zu ama Projekt.' },
      { title: 'Fälligkeit', example: 'due:YYYY-MM-DD', desc: 'Zeigt, bis wann die Uffgab erledigt sei muaß.' },
      { title: 'Startdatum', example: 't:YYYY-MM-DD', desc: 'Schwellenwert. Blendet Sachen aus, bis des Startdatum da isch.' },
      { title: 'Wiederholung', example: 'rec:1d, rec:+1w', desc: 'Erstellt glei a neue Uffgab (d: Däg, w: Woche, m: Monate) wenn d\'alte erledigt isch.' },
      { title: 'Zuständigkeit', example: 'who:nomen', desc: 'Trägt ei, wer die Uffgab macha soll (z. B. who:cornelius).' }
    ],
    syncTitle: 'Wie klappt des mit der Cloud?',
    syncIntroduction: 'D\'App ka dei Lischd direkt in dei Microsoft OneDrive Cloud speichera. So bleibt dei todo.txt auf all deine Apparate auf em gleicha Stand.',
    steps: [
      { title: '1. OneDrive vrbinda', desc: 'Melde di mit dei\'m Microsoft-Konto a. Des isch sicher über OAuth2.' },
      { title: '2. Datei aussuacha', desc: 'Nimm a todo.txt wo scho da isch oder mach a neue direkt im OneDrive.' },
      { title: '3. Automatisches Speichera', desc: 'Jede Änderung rutscht sofort in d\'Cloud. Wenn offline bisch, wird gsynct sobald wieder online bisch.' }
    ],
    hotkeysTitle: 'Taschdadur-Tasten',
    hotkeyList: [
      { keys: '?', desc: 'Hilf auf- und zumacha' },
      { keys: 'N / I', desc: 'Direkt zom Uffgab-Oigeba-Feld springa' },
      { keys: 'Esc', desc: 'Eingab oder Fenster zumacha' },
      { keys: 'Ctrl + Z / U', desc: 'Letzte Sach rückgängig macha' },
      { keys: 'A', desc: 'Erledigte Sachen ins Archiv schiaba' },
      { keys: '1 - 9', desc: 'Smart-Listen durchschalten' },
      { keys: 'S', desc: 'Suchfeld fokussiera' },
      { keys: 'C', desc: 'Farbe (Hell / Dunkel) wechsla' },
      { keys: 'D', desc: 'Designdichte umschalten' },
      { keys: 'K', desc: 'Zwischen Liste und Kanban hin und her springa' }
    ]
  },
  uk: {
    syntaxTitle: 'Що таке формат todo.txt?',
    syntaxIntroduction: 'Формат todo.txt — це простий, зручний для читання людиною текстовий формат файлів для списків завдань. Кожен рядок у файлі відповідає рівно одному завданню. Дотримуючись простих правил синтаксису, додаток розпізнає пріоритети, проєкти, контексти та інші метадані.',
    sampleLineTitle: 'Приклад рядка:',
    syntaxElementsTitle: 'Елементи синтаксису',
    elements: [
      { title: 'Пріоритет', example: '(A), (B), (C) ...', desc: 'Велика літера в дужках на самому початку рядка визначає пріоритет.' },
      { title: 'Дата Створення', example: 'YYYY-MM-DD', desc: 'Необов\'язкова дата відразу після пріоритету визначає дату створення завдання.' },
      { title: 'Контекст', example: '@supermarket', desc: 'Слово, що починається з @, позначає місце, інструмент або ситуацію.' },
      { title: 'Проєкт', example: '+weekend', desc: 'Слово, що починається з +, пов\'язує завдання з проєктом або категорією.' },
      { title: 'Термін Виконання', example: 'due:YYYY-MM-DD', desc: 'Вказує кінцеву дату, до якої завдання має бути виконане.' },
      { title: 'Дата Початку', example: 't:YYYY-MM-DD', desc: 'Дата початку показу завдання. Завдання приховане до настання цієї дати.' },
      { title: 'Повторення', example: 'rec:1d, rec:+1w', desc: 'Автоматично створює нове повторюване завдання після виконання (d: дні, w: тижні, m: місяці).' },
      { title: 'Виконавець', example: 'who:name', desc: 'Призначає завдання конкретній особі (напр., who:cornelius).' }
    ],
    syncTitle: 'Як працює синхронізація?',
    syncIntroduction: 'Додаток може зберігати ваш список завдань безпосередньо у хмарі Microsoft OneDrive. Це дозволяє синхронізувати файл todo.txt на всіх ваших пристроях.',
    steps: [
      { title: '1. Підключити OneDrive', desc: 'Увійдіть за допомогою свого облікового запису Microsoft. Підключення безпечне через OAuth2.' },
      { title: '2. Вибрати файл', desc: 'Оберіть існуючий файл todo.txt або створіть новий безпосередньо у вашому OneDrive.' },
      { title: '3. Автозбереження', desc: 'Будь-які зміни миттєво завантажуються в хмару. В офлайн-режимі синхронізація відбудеться, щойно з\'явиться інтернет.' }
    ],
    hotkeysTitle: 'Гарячі Клавіші',
    hotkeyList: [
      { keys: '?', desc: 'Відкрити / закрити вікно довідки' },
      { keys: 'N / I', desc: 'Фокусувати поле введення завдань' },
      { keys: 'Esc', desc: 'Закрити модальні вікна або активне поле' },
      { keys: 'Ctrl + Z / U', desc: 'Скасувати останню дію' },
      { keys: 'A', desc: 'Архівувати виконані завдання' },
      { keys: '1 - 9', desc: 'Перемикатися між розумними списками' },
      { keys: 'S', desc: 'Фокусувати поле пошуку' },
      { keys: 'C', desc: 'Змінити тему (світла / темна)' },
      { keys: 'D', desc: 'Змінити щільність інтерфейсу' },
      { keys: 'K', desc: 'Перемикатися між списком та дошкою Kanban' }
    ]
  },
  he: {
    syntaxTitle: 'מהו פורמט todo.txt?',
    syntaxIntroduction: 'פורמט todo.txt הוא פורמט פשוט וקריא לבני אדם עבור רשימות משימות. כל שורה בקובץ מייצגת משימה אחת בדיוק. באמצעות שמירה על כללי תחביר פשוטים, האפליקציה מזהה עדיפויות, פרויקטים, הקשרים ונתונים נוספים.',
    sampleLineTitle: 'שורת דוגמה:',
    syntaxElementsTitle: 'רכיבי התחביר',
    elements: [
      { title: 'עדיפות', example: '(A), (B), (C) ...', desc: 'אות גדולה בסוגריים בתחילת השורה קובעת את עדיפות המשימה.' },
      { title: 'תאריך יצירה', example: 'YYYY-MM-DD', desc: 'תאריך אופציונלי מיד לאחר העדיפות קובע את תאריך יצירת המשימה.' },
      { title: 'הקשר', example: '@supermarket', desc: 'מילה המתחילה ב-@ מסמנת מיקום, כלי או מצב.' },
      { title: 'פרויקט', example: '+weekend', desc: 'מילה המתחילה ב-+ משייכת את המשימה לפרויקט או לקטגוריה.' },
      { title: 'תאריך יעד', example: 'due:YYYY-MM-DD', desc: 'מגדיר את התאריך האחרון לביצוע המשימה.' },
      { title: 'תאריך התחלה', example: 't:YYYY-MM-DD', desc: 'תאריך סף להצגה. מסתיר את המשימה עד להגעת התאריך.' },
      { title: 'מחזוריות', example: 'rec:1d, rec:+1w', desc: 'יוצר משימה חדשה באופן אוטומטי בעת השלמתה (d: ימים, w: שבועות, m: חודשים).' },
      { title: 'אחראי', example: 'who:name', desc: 'משייך את המשימה לאדם ספציפי (למשל: who:cornelius).' }
    ],
    syncTitle: 'כיצד פועל הסנכרון?',
    syncIntroduction: 'האפליקציה יכולה לשמור את רשימת המשימות שלך ישירות בחשבון ה-Microsoft OneDrive שלך. כך קובץ todo.txt נשאר מסונכרן בכל המכשירים שלך.',
    steps: [
      { title: '1. חיבור ל-OneDrive', desc: 'התחבר עם חשבון המיקרוסופט שלך. החיבור מאובטח באמצעות פרוטוקול OAuth2.' },
      { title: '2. בחירת קובץ', desc: 'בחר קובץ todo.txt קיים או צור קובץ חדש ישירות ב-OneDrive שלך.' },
      { title: '3. שמירה אוטומטית', desc: 'כל שינוי מועלה מיד לענן. במצב לא מקוון, השינויים יסונכרנו ברגע שתחזור לרשת.' }
    ],
    hotkeysTitle: 'קיצורי מקלדת',
    hotkeyList: [
      { keys: '?', desc: 'פתח / סגור את חלון העזרה' },
      { keys: 'N / I', desc: 'התמקד בשדה הזנת המשימות' },
      { keys: 'Esc', desc: 'סגור חלונות מודאליים או שדה קלט פעיל' },
      { keys: 'Ctrl + Z / U', desc: 'בטל את הפעולה האחרונה' },
      { keys: 'A', desc: 'העבר משימות שהושלמו לארכיון' },
      { keys: '1 - 9', desc: 'החלף בין רשימות חכמות' },
      { keys: 'S', desc: 'התמקד בשדה החיפוש' },
      { keys: 'C', desc: 'החלף בין עיצוב בהיר לכהה' },
      { keys: 'D', desc: 'שנה את צפיפות העיצוב' },
      { keys: 'K', desc: 'החלף בין תצוגת רשימה לתצוגת לוח קנבן' }
    ]
  },
  el: {
    syntaxTitle: 'Τι είναι η μορφή todo.txt;',
    syntaxIntroduction: 'Η μορφή todo.txt είναι μια απλή, αναγνώσιμη από τον άνθρωπο μορφή αρχείου για λίστες εργασιών. Κάθε γραμμή αντιστοιχεί ακριβώς σε μία εργασία. Ακολουθώντας απλούς κανόνες σύνταξης, η εφαρμογή αναγνωρίζει προτεραιότητες, έργα, πλαίσια και άλλα μεταδεδομένα.',
    sampleLineTitle: 'Παράδειγμα γραμμής:',
    syntaxElementsTitle: 'Συντακτικά Στοιχεία',
    elements: [
      { title: 'Προτεραιότητα', example: '(A), (B), (C) ...', desc: 'Ένα κεφαλαίο γράμμα σε παρένθεση στην αρχή της γραμμής ορίζει την προτεραιότητα.' },
      { title: 'Ημερομηνία Δημιουργίας', example: 'YYYY-MM-DD', desc: 'Μια προαιρετική ημερομηνία αμέσως μετά την προτεραιότητα ορίζει την ημερομηνία δημιουργίας.' },
      { title: 'Πλαίσιο', example: '@supermarket', desc: 'Μια λέξη που ξεκινά με @ επισημαίνει μια τοποθεσία ή κατάσταση.' },
      { title: 'Έργο', example: '+weekend', desc: 'Μια λέξη που ξεκινά με + αντιστοιχεί την εργασία σε ένα έργο ή κατηγορία.' },
      { title: 'Ημερομηνία Λήξης', example: 'due:YYYY-MM-DD', desc: 'Καθορίζει πότε πρέπει να ολοκληρωθεί η εργασία.' },
      { title: 'Ημερομηνία Έναρξης', example: 't:YYYY-MM-DD', desc: 'Κατώφλι έναρξης. Αποκρύπτει την εργασία μέχρι να φτάσει αυτή η ημερομηνία.' },
      { title: 'Επανάληψη', example: 'rec:1d, rec:+1w', desc: 'Αυτόματη δημιουργία επαναλαμβανόμενης εργασίας κατά την ολοκλήρωση (d: ημέρες, w: εβδομάδες, m: μήνες).' },
      { title: 'Υπεύθυνος', example: 'who:name', desc: 'Αναθέτει την εργασία σε ένα άτομο (π.χ. who:cornelius).' }
    ],
    syncTitle: 'Πώς λειτουργεί ο συγχρονισμός;',
    syncIntroduction: 'Η εφαρμογή μπορεί να αποθηκεύσει τη λίστα εργασιών σας απευθείας στο Microsoft OneDrive cloud σας, διατηρώντας το αρχείο todo.txt συγχρονισμένο σε όλες τις συσκευές σας.',
    steps: [
      { title: '1. Σύνδεση OneDrive', desc: 'Συνδεθείτε με τον λογαριασμό σας Microsoft. Η σύνδεση είναι ασφαλής μέσω OAuth2.' },
      { title: '2. Επιλογή Αρχείου', desc: 'Επιλέξτε ένα υπάρχον αρχείο todo.txt ή δημιουργήστε ένα νέο απευθείας στο OneDrive σας.' },
      { title: '3. Αυτόματη Αποθήκευση', desc: 'Κάθε αλλαγή μεταφορτώνεται αμέσως. Εάν είστε εκτός σύνδεσης, ο συγχρονισμός θα γίνει μόλις συνδεθείτε.' }
    ],
    hotkeysTitle: 'Συντομεύσεις Πληκτρολογίου',
    hotkeyList: [
      { keys: '?', desc: 'Άνοιγμα / κλείσιμο του παραθύρου βοήθειας' },
      { keys: 'N / I', desc: 'Εστίαση στο πεδίο εισαγωγής εργασίας' },
      { keys: 'Esc', desc: 'Κλείσιμο αναδυόμενων παραθύρων ή ενεργής εισαγωγής' },
      { keys: 'Ctrl + Z / U', desc: 'Αναίρεση της τελευταίας ενέργειας' },
      { keys: 'A', desc: 'Αρχειοθέτηση ολοκληρωμένων εργασιών' },
      { keys: '1 - 9', desc: 'Εναλλαγή προβολών έξυπνων λιστών' },
      { keys: 'S', desc: 'Εστίαση στη γραμμή αναζήτησης' },
      { keys: 'C', desc: 'Εναλλαγή φωτεινού / σκοτεινού θέματος' },
      { keys: 'D', desc: 'Αλλαγή της πυκνότητας σχεδίασης' },
      { keys: 'K', desc: 'Εναλλαγή μεταξύ προβολής λίστας και πίνακα Kanban' }
    ]
  },
  tr: {
    syntaxTitle: 'todo.txt formatı nedir?',
    syntaxIntroduction: 'todo.txt formatı, görev listeleri için tasarlanmış basit, insan tarafından okunabilir bir dosya formatıdır. Dosyadaki her satır tam olarak bir göreve karşılık gelir. Basit sözdizimi kurallarını takip ederek, uygulama öncelikleri, projeleri, kapsamları ve diğer meta verileri tanır.',
    sampleLineTitle: 'Örnek Satır:',
    syntaxElementsTitle: 'Sözdizimi Öğeleri',
    elements: [
      { title: 'Öncelik', example: '(A), (B), (C) ...', desc: 'Satırın en başındaki parantez içindeki büyük harf görevin önceliğini belirler.' },
      { title: 'Oluşturulma Tarihi', example: 'YYYY-MM-DD', desc: 'Önceliğin hemen ardındaki isteğe bağlı tarih, görevin oluşturulma tarihini ayarlar.' },
      { title: 'Kapsam', example: '@market', desc: '@ ile başlayan kelime, görevin yapılacağı konumu veya durumu belirtir.' },
      { title: 'Proje', example: '+haftasonu', desc: '+ ile başlayan kelime, görevi bir projeye veya kategoriye atar.' },
      { title: 'Vade Tarihi', example: 'due:YYYY-MM-DD', desc: 'Görevin ne zamana kadar tamamlanması gerektiğini belirtir.' },
      { title: 'Başlangıç Tarihi', example: 't:YYYY-MM-DD', desc: 'Eşik tarihi. Görevi bu tarihe kadar listede gizler.' },
      { title: 'Yineleme', example: 'rec:1d, rec:+1w', desc: 'Tamamlandığında görevi otomatik olarak yeniden oluşturur (d: gün, w: hafta, m: ay).' },
      { title: 'Sorumlu', example: 'who:name', desc: 'Görevi bir kişiye atar (ör. who:cornelius).' }
    ],
    syncTitle: 'Eşitleme nasıl çalışır?',
    syncIntroduction: 'Uygulama, görev listenizi doğrudan Microsoft OneDrive bulutunuzda saklayabilir. Bu, todo.txt dosyanızın tüm cihazlarınızda senkronize kalmasını sağlar.',
    steps: [
      { title: '1. OneDrive Bağlantısı', desc: 'Microsoft hesabınızla oturum açın. Bağlantı OAuth2 aracılığıyla güvenli şekilde sağlanır.' },
      { title: '2. Dosya Seçimi', desc: 'Mevcut bir todo.txt dosyasını seçin veya doğrudan OneDrive\'ınızda yeni bir tane oluşturun.' },
      { title: '3. Otomatik Kaydetme', desc: 'Her değişiklik anında buluta yüklenir. Çevrimdışıysanız, tekrar bağlandığınızda değişiklikler senkronize edilir.' }
    ],
    hotkeysTitle: 'Klavye Kısayolları',
    hotkeyList: [
      { keys: '?', desc: 'Yardım penceresini aç / kapat' },
      { keys: 'N / I', desc: 'Görev giriş alanına odaklan' },
      { keys: 'Esc', desc: 'Modalları veya etkin giriş alanını kapat' },
      { keys: 'Ctrl + Z / U', desc: 'Son işlemi geri al' },
      { keys: 'A', desc: 'Tamamlanan görevleri arşivle' },
      { keys: '1 - 9', desc: 'Akıllı liste görünümleri arasında geçiş yap' },
      { keys: 'S', desc: 'Arama çubuğuna odaklan' },
      { keys: 'C', desc: 'Açık / karanlık temayı değiştir' },
      { keys: 'D', desc: 'Tasarım yoğunluğunu değiştir' },
      { keys: 'K', desc: 'Liste ve Kanban kart görünümü arasında geçiş yap' }
    ]
  }
};
