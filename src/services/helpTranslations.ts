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
    syncTitle: 'Welche Synchronisations-Optionen gibt es?',
    syncIntroduction: 'Die App unterstützt verschiedene Methoden, um deine todo.txt-Datei zu speichern und auf all deinen Geräten auf demselben Stand zu halten:',
    steps: [
      { title: 'Cloud-Speicher (OneDrive / Google Drive)', desc: 'Sichere Verbindung via OAuth2. Deine Aufgaben werden automatisch im Hintergrund mit deiner Cloud synchronisiert.' },
      { title: 'Eigener Server (WebDAV)', desc: 'Verbinde Nextcloud, ownCloud oder andere WebDAV-Dienste über Server-URL und Zugangsdaten für maximale Datensouveränität.' },
      { title: 'Git-Repositories (GitHub / GitLab / etc.)', desc: 'Synchronisiere deine todo.txt direkt mit einem Git-Repo unter Verwendung von HTTPS-URLs und Personal Access Tokens.' },
      { title: 'Lokales Dateisystem (File System Access API)', desc: 'Verknüpfe eine echte lokale Textdatei auf deiner Festplatte. Änderungen in der App werden sofort in die Datei geschrieben.' },
      { title: 'Browser-Speicher (Standard)', desc: 'Startet ohne Setup direkt im lokalen Browser-Speicher. Deine Daten können jederzeit importiert/exportiert oder verknüpft werden.' }
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
    syncTitle: 'What synchronization options are available?',
    syncIntroduction: 'The app supports several methods to save and keep your todo.txt file synchronized across all your devices:',
    steps: [
      { title: 'Cloud Storage (OneDrive / Google Drive)', desc: 'Secure connection via OAuth2. Your tasks are automatically synchronized with your cloud in the background.' },
      { title: 'Personal Server (WebDAV)', desc: 'Connect to Nextcloud, ownCloud, or other WebDAV services using the server URL and credentials for maximum data sovereignty.' },
      { title: 'Git Repositories (GitHub / GitLab / etc.)', desc: 'Sync your todo.txt directly with a Git repository using HTTPS URLs and Personal Access Tokens.' },
      { title: 'Local File System (File System Access API)', desc: 'Link a local text file on your drive. Changes in the app are written directly to your file.' },
      { title: 'Browser Storage (Default)', desc: 'Starts instantly with zero setup using local browser storage. You can import/export or link a provider at any time.' }
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
    syncTitle: 'Quae sunt optiones synchronizationis?',
    syncIntroduction: 'Haec applicatio varias rationes adhibet ut catalogus pensorum tuorum servetur et in omnibus machinis synchronus maneat:',
    steps: [
      { title: 'Nubes (OneDrive / Google Drive)', desc: 'Connexio secura per OAuth2. Pensa tua automatice in posteriore parte synchronizantur.' },
      { title: 'Proprius Server (WebDAV)', desc: 'Iunge Nextcloud, ownCloud aut alios WebDAV cum URL et indicio ad plenam datorum potestatem.' },
      { title: 'Git (GitHub / GitLab / etc.)', desc: 'Synchroniza todo.txt cum repositorio Git per HTTPS URL et Personal Access Tokens.' },
      { title: 'Scrinium Locale (File System API)', desc: 'Iunge verum scrinium in computatro tuo. Mutationes statim in illo scribuntur.' },
      { title: 'Memoria Navigatoris (Defalta)', desc: 'Incipit sine ulla dispositione in memoria navigatoris. Potes exportare aut iungere quandocumque vis.' }
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
    syncTitle: 'Quelles sont les options de synchronisation disponibles ?',
    syncIntroduction: 'L\'application prend en charge plusieurs méthodes pour sauvegarder et synchroniser votre fichier todo.txt sur tous vos appareils :',
    steps: [
      { title: 'Stockage Cloud (OneDrive / Google Drive)', desc: 'Connexion sécurisée via OAuth2. Vos tâches sont synchronisées automatiquement en arrière-plan.' },
      { title: 'Serveur Personnel (WebDAV)', desc: 'Connectez Nextcloud, ownCloud ou d\'autres services WebDAV avec l\'URL et vos identifiants pour un contrôle total de vos données.' },
      { title: 'Dépôts Git (GitHub / GitLab / etc.)', desc: 'Synchronisez votre tout.txt directement avec un dépôt Git via HTTPS et un jeton d\'accès personnel (PAT).' },
      { title: 'Système de Fichiers Local (File System API)', desc: 'Associez un fichier texte local sur votre disque. Les modifications sont écrites instantanément dans le fichier.' },
      { title: 'Stockage Navigateur (Par défaut)', desc: 'Démarre immédiatement sans configuration dans le stockage local du navigateur. Vous pouvez exporter ou associer un service à tout moment.' }
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
    syncTitle: 'Quali opzioni di sincronizzazione sono disponibili?',
    syncIntroduction: 'L\'app supporta diversi metodi per salvare e mantenere il tuo file todo.txt sincronizzato su tutti i tuoi dispositivi:',
    steps: [
      { title: 'Cloud Storage (OneDrive / Google Drive)', desc: 'Connessione sicura tramite OAuth2. I tuoi compiti vengono sincronizzati in background automaticamente.' },
      { title: 'Server Personale (WebDAV)', desc: 'Collega Nextcloud, ownCloud o altri servizi WebDAV tramite URL e credenziali per il massimo controllo dei tuoi dati.' },
      { title: 'Repository Git (GitHub / GitLab / ecc.)', desc: 'Sincronizza il tuo todo.txt direttamente con un repository Git usando URL HTTPS e Token di Accesso Personale.' },
      { title: 'File System Locale (File System API)', desc: 'Collega un file di testo locale sul tuo disco. Le modifiche vengono scritte istantaneamente nel file.' },
      { title: 'Memoria del Browser (Predefinita)', desc: 'Avvio immediato senza configurazione nella memoria locale del browser. Puoi esportare o collegare un provider in qualsiasi momento.' }
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
    syncTitle: '¿Qué opciones de sincronización hay disponibles?',
    syncIntroduction: 'La aplicación admite varios métodos para guardar y mantener tu archivo todo.txt sincronizado en todos tus dispositivos:',
    steps: [
      { title: 'Almacenamiento en la Nube (OneDrive / Google Drive)', desc: 'Conexión segura mediante OAuth2. Tus tareas se sincronizan automáticamente en segundo plano.' },
      { title: 'Servidor Personal (WebDAV)', desc: 'Conecta Nextcloud, ownCloud u otros servicios WebDAV con la URL y credenciales para un control total de tus datos.' },
      { title: 'Repositorios Git (GitHub / GitLab / etc.)', desc: 'Sincroniza tu todo.txt directamente con un repositorio Git usando URLs HTTPS y Tokens de Acceso Personal.' },
      { title: 'Sistema de Archivos Local (File System API)', desc: 'Vincula un archivo de texto local en tu disco. Los cambios se escriben instantáneamente en el archivo.' },
      { title: 'Almacenamiento del Navegador (Por defecto)', desc: 'Inicia al instante sin configuración en el almacenamiento del navegador. Puedes exportar o vincular un proveedor en cualquier momento.' }
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
    syncTitle: '有哪些可用的同步选项？',
    syncIntroduction: '本应用支持多种方式保存和同步您的 todo.txt 文件，确保所有设备上的数据一致：',
    steps: [
      { title: '云端存储 (OneDrive / Google Drive)', desc: '通过 OAuth2 安全连接。您的任务将在后台自动与云端同步。' },
      { title: '个人服务器 (WebDAV)', desc: '使用服务器 URL 和凭据连接 Nextcloud、ownCloud 或其他 WebDAV 服务，保障数据主权。' },
      { title: 'Git 仓库 (GitHub / GitLab 等)', desc: '使用 HTTPS URL 和个人访问令牌 (PAT) 直接将 todo.txt 同步到 Git 仓库。' },
      { title: '本地文件系统 (File System API)', desc: '关联您磁盘上的本地文本文件。应用中的更改将即时写入该文件。' },
      { title: '浏览器存储 (默认)', desc: '无需任何设置即可在浏览器本地存储中启动。您可以随时导入、导出或关联上述云同步服务。' }
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
    syncTitle: 'ما هي خيارات المزامنة المتاحة؟',
    syncIntroduction: 'يدعم التطبيق عدة طرق لحفظ ملف todo.txt الخاص بك وإبقائه متزامنًا عبر جميع أجهزتك:',
    steps: [
      { title: 'التخزين السحابي (OneDrive / Google Drive)', desc: 'اتصال آمن عبر OAuth2. تتم مزامنة مهامك تلقائيًا في الخلفية مع السحابة.' },
      { title: 'خادم شخصي (WebDAV)', desc: 'قم بربط Nextcloud أو ownCloud أو خدمات WebDAV الأخرى باستخدام عنوان الخادم وبيانات الاعتماد للتحكم الكامل ببياناتك.' },
      { title: 'مستودعات Git (GitHub / GitLab / إلخ)', desc: 'قم بمزامنة ملف todo.txt مباشرة مع مستودع Git باستخدام عناوين HTTPS ورموز الوصول الشخصية (PAT).' },
      { title: 'نظام الملفات المحلي (File System API)', desc: 'اربط ملف نصي محلي على قرصك. تُكتب التغييرات في التطبيق مباشرة إلى الملف فوراً.' },
      { title: 'تخزين المتصفح (افتراضي)', desc: 'يبدأ العمل فوراً بدون إعدادات عبر التخزين المحلي للمتصفح. يمكنك تصدير بياناتك أو ربطها بموفر خدمة في أي وقت.' }
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
    syncIntroduction: 'ऐप आपकी todo.txt फ़ाइल को सुरक्षित करने और आपके सभी उपकरणों पर सिंक रखने के लिए कई तरीकों का समर्थन करता है:',
    steps: [
      { title: 'क्लाउड स्टोरेज (OneDrive / Google Drive)', desc: 'OAuth2 के माध्यम से सुरक्षित कनेक्शन। आपके कार्य स्वचालित रूप से बैकग्राउंड में आपके क्लाउड से सिंक हो जाते हैं।' },
      { title: 'व्यक्तिगत सर्वर (WebDAV)', desc: 'अपने डेटा पर पूर्ण नियंत्रण के लिए सर्वर URL और क्रेडेंशियल का उपयोग करके Nextcloud, ownCloud या अन्य WebDAV सेवाओं को कनेक्ट करें।' },
      { title: 'Git रिपॉजिटरी (GitHub / GitLab / आदि)', desc: 'HTTPS URL और पर्सनल एक्सेस टोकन का उपयोग करके अपनी todo.txt को सीधे Git रिपॉजिटरी से सिंक करें।' },
      { title: 'स्थानीय फ़ाइल सिस्टम (File System API)', desc: 'अपने डिस्क पर एक वास्तविक स्थानीय टेक्स्ट फ़ाइल को लिंक करें। ऐप में किए गए बदलाव तुरंत फ़ाइल में लिखे जाते हैं।' },
      { title: 'ब्राउज़र स्टोरेज (डिफ़ॉल्ट)', desc: 'स्थानीय ब्राउज़र स्टोरेज में बिना किसी सेटअप के तुरंत शुरू होता है। आप किसी भी समय डेटा निर्यात या किसी प्रदाता से लिंक कर सकते हैं।' }
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
    syncIntroduction: 'O aplicativo suporta vários métodos para salvar e manter o seu arquivo todo.txt sincronizado em todos os seus dispositivos:',
    steps: [
      { title: 'Armazenamento em Nuvem (OneDrive / Google Drive)', desc: 'Conexão segura via OAuth2. Suas tarefas são sincronizadas automaticamente em segundo plano.' },
      { title: 'Servidor Pessoal (WebDAV)', desc: 'Conecte ao Nextcloud, ownCloud ou outros serviços WebDAV com a URL e credenciais para controle total dos seus dados.' },
      { title: 'Repositórios Git (GitHub / GitLab / etc.)', desc: 'Sincronize seu todo.txt diretamente com um repositório Git usando URLs HTTPS e Tokens de Acesso Pessoal.' },
      { title: 'Sistema de Arquivos Local (File System API)', desc: 'Vincule um arquivo de texto local no seu disco. As alterações são gravadas instantaneamente no arquivo.' },
      { title: 'Armazenamento do Navegador (Padrão)', desc: 'Inicia instantaneamente sem configuração no armazenamento local do navegador. Você pode exportar ou vincular a qualquer momento.' }
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
    syncTitle: 'Was gibt\'s für Sync-Optiona?',
    syncIntroduction: 'D\'App kann dei todo.txt auf verschiedene Weaga speichera, damit dei Zeug auf all deine Apparate gleich bleibt:',
    steps: [
      { title: 'Wolka-Speicher (OneDrive / Google Drive)', desc: 'Sichere Sach über OAuth2. Dei Kram wird automatisch em Hintergrund gsynct.' },
      { title: 'Eigener Server (WebDAV)', desc: 'Häng dei Nextcloud oder ownCloud nei über URL und Login, damit dei Zeug bei dir bleibt.' },
      { title: 'Git-Repositories (GitHub / GitLab / etc.)', desc: 'Schieb dei todo.txt direkt in a Git-Repository mit HTTPS-Link und Access Token.' },
      { title: 'Lokale Datei (File System API)', desc: 'Verknüpf des direkt mit a echte Textdatei auf dei\'m Rechner. Jede Änderung steht sofort drin.' },
      { title: 'Browser-Speicher (Standard)', desc: 'Fängt glei ohne Gschiss im Browser-Speicher a. Du kannst dei Zeug jederzeit exportiera oder verknüpfa.' }
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
    syncTitle: 'Які варіанти синхронізації доступні?',
    syncIntroduction: 'Додаток підтримує кілька методів збереження та синхронізації файлу todo.txt між усіма вашими пристроями:',
    steps: [
      { title: 'Хмарне сховище (OneDrive / Google Drive)', desc: 'Безпечне підключення через OAuth2. Ваші завдання автоматично синхронізуються з хмарою у фоновому режимі.' },
      { title: 'Власний сервер (WebDAV)', desc: 'Підключіть Nextcloud, ownCloud або інші служби WebDAV за допомогою URL-адреси та облікових даних для повного контролю.' },
      { title: 'Репозиторії Git (GitHub / GitLab / тощо)', desc: 'Синхронізуйте todo.txt безпосередньо з репозиторієм Git за допомогою HTTPS URL та персональних токенів доступу.' },
      { title: 'Локальна файлова система (File System API)', desc: 'Зв\'яжіть локальний текстовий файл на диску. Зміни в додатку негайно записуються у файл.' },
      { title: 'Локальне сховище браузера (Типово)', desc: 'Запуск без налаштування у локальному сховищі браузера. Ви можете експортувати дані або підключити провайдера в будь-я час.' }
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
    syncTitle: 'אילו אפשרויות סנכרון זמינות?',
    syncIntroduction: 'האפליקציה תומכת במספר שיטות לשמירה וסנכרון של קובץ todo.txt שלך בכל המכשירים שלך:',
    steps: [
      { title: 'אחסון בענן (OneDrive / Google Drive)', desc: 'חיבור מאובטח באמצעות OAuth2. המשימות שלך מסונכרנות אוטומטית ברקע עם הענן שלך.' },
      { title: 'שרת אישי (WebDAV)', desc: 'חבר את Nextcloud, ownCloud או שירותי WebDAV אחרים באמצעות כתובת השרת ופרטי הגישה לשליطة מלאה בנתונים שלך.' },
      { title: 'מאגרי Git (GitHub / GitLab וכדומה)', desc: 'סנכרן את קובץ todo.txt ישירות עם מאגר Git באמצעות כתובות HTTPS וסמלי גישה אישיים (Tokens).' },
      { title: 'מערכת קבצים מקומית (File System API)', desc: 'קשר קובץ טקස් מקומי אמיתי בכונן שלך. שינויים באפליקציה נכתבים מיד לקובץ.' },
      { title: 'אחסון דפדפן (ברירת מחדל)', desc: 'מתחיל מיד ללא הגדרה באחסון המקומי של הדפדפן. באפשרותך לייצא את הנתונים או לקשר ספק בכל עת.' }
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
    syncTitle: 'Ποιες επιλογές συγχρονισμού είναι διαθέσιμες;',
    syncIntroduction: 'Η εφαρμογή υποστηρίζει διάφορες μεθόδους για την αποθήκευση και τον συγχρονισμό του αρχείου todo.txt σε όλες τις συσκευές σας:',
    steps: [
      { title: 'Cloud Storage (OneDrive / Google Drive)', desc: 'Ασφαλής σύνδεση μέσω OAuth2. Οι εργασίες σας συγχρονίζονται αυτόματα στο παρασκήνιο.' },
      { title: 'Προσωπικός διακομιστής (WebDAV)', desc: 'Συνδέστε Nextcloud, ownCloud ή άλλες υπηρεσίες WebDAV χρησιμοποιώντας τη διεύθυνση URL και τα διαπιστευτήρια για απόλυτο έλεγχο των δεδομένων σας.' },
      { title: 'Αποθετήρια Git (GitHub / GitLab / κ.λπ.)', desc: 'Συγχρονίστε το todo.txt απευθείας με ένα αποθετήριο Git χρησιμοποιώντας διευθύνσεις URL HTTPS και προσωπικά διακριτικά πρόσβασης.' },
      { title: 'Τοπικό σύστημα αρχείων (File System API)', desc: 'Συνδέστε ένα πραγματικό τοπικό αρχείο κειμένου στον δίσκο σας. Οι αλλαγές στην εφαρμογή εγγράφονται αμέσως στο αρχείο.' },
      { title: 'Χώρος αποθήκευσης προγράμματος περιήγησης (Προεπιλογή)', desc: 'Ξεκινά αμέσως χωρίς ρυθμίσεις στον τοπικό χώρο αποθήκευσης. Μπορείτε να κάνετε εξαγωγή ή σύνδεση ανά πάσα στιγμή.' }
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
    syncTitle: 'Hangi senkronizasyon seçenekleri mevcut?',
    syncIntroduction: 'Uygulama, todo.txt dosyanızı kaydetmek ve tüm cihazlarınızda senkronize tutmak için birkaç yöntemi destekler:',
    steps: [
      { title: 'Bulut Depolama (OneDrive / Google Drive)', desc: 'OAuth2 ile güvenli bağlantı. Görevleriniz arka planda bulutunuzla otomatik olarak eşitlenir.' },
      { title: 'Kişisel Sunucu (WebDAV)', desc: 'Veri kontrolünü elinizde tutmak için sunucu URL\'si ve kimlik bilgilerini kullanarak Nextcloud, ownCloud veya diğer WebDAV servislerini bağlayın.' },
      { title: 'Git Depoları (GitHub / GitLab / vb.)', desc: 'HTTPS URL\'leri ve Kişisel Erişim Belirteçleri (PAT) kullanarak todo.txt dosyanızı doğrudan bir Git deposuna eşitleyin.' },
      { title: 'Yerel Dosya Sistemi (File System API)', desc: 'Diskinizdeki yerel bir metin dosyasını bağlayın. Uygulamadaki değişiklikler anında dosyaya yazılır.' },
      { title: 'Tarayıcı Depolama Alanı (Varsayılan)', desc: 'Herhangi bir kurulum olmadan tarayıcının yerel hafızasında başlar. İstediğiniz zaman verileri dışa aktarabilir veya bir servise bağlayabilirsiniz.' }
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
