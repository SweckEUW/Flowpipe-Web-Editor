# Flowpipe-Editoren im Vergleich

**flowpipe-editor (Qt/Python)** ↔ **flowpipe-web-editor (Vue/TypeScript)**

Stand der Untersuchung: Branch `dev`, Commit `16a2113` ("Refactor for basic flowpipeeditor vue component export"), inklusive der zu diesem Zeitpunkt nicht committeten Änderungen an `FlowPipeEditor.vue`, `GraphCanvas.vue`, `types/flowpipe.ts` und `util/flowpipeBaklavaConverter.ts`.

---

## 1. Scope

Beide Projekte visualisieren Graphen des [flowpipe](https://github.com/PaulSchweizer/flowpipe)-Frameworks, setzen dabei aber auf getrennte Technologie-Stacks und verfolgen unterschiedliche Ziele:

| | flowpipe-editor | flowpipe-web-editor |
|---|---|---|
| Ort | `../flowpipe-editor` | dieses Repository |
| Selbstbeschreibung | *"In its current state the Widget is a visualizer only not an editor."* (README) | *"browser-based visual pipeline editor"* (README) |
| Reifegrad | veröffentlicht auf PyPI, funktionsfähig | früher Refactoring-Zustand, Kernfunktionen noch nicht verdrahtet |

Dieses Dokument vergleicht **UI-Aufbau** und **Funktionsumfang** und listet am Ende, welche Features in **beiden** Editoren fehlen.

---

## 2. Steckbriefe

### flowpipe-editor (Qt)

| Aspekt | Wert |
|---|---|
| Sprache / Runtime | Python ≥ 3.9 |
| UI-Framework | Qt via [`Qt.py`](https://github.com/mottosso/Qt.py) (PySide/PyQt-agnostisch) |
| Graph-Engine | [NodeGraphQt](https://github.com/jchanvfx/NodeGraphQt) `^0.6.3` |
| Distribution | PyPI-Paket `flowpipe_editor` (Poetry, dynamic versioning) |
| Einbettung | `FlowpipeEditorWidget(parent=…)` — ein `QWidget`, das in beliebige Qt-Anwendungen (Maya, Nuke, Houdini …) eingehängt wird |
| Eingabe | ein **lebendes** `flowpipe.Graph`-Objekt via `load_graph(graph)` |
| Lizenz | MIT |
| Codeumfang | ~875 Zeilen Python, davon ~633 in der aus NodeGraphQt übernommenen und gepatchten Properties-Bin |
| CI | GitHub Actions: `pylint.yml`, `publish.yml` |

Kern: [`flowpipe_editor/flowpipe_editor_widget.py`](../../flowpipe-editor/flowpipe_editor/flowpipe_editor_widget.py)

### flowpipe-web-editor (Vue)

| Aspekt | Wert |
|---|---|
| Sprache / Runtime | TypeScript, Browser |
| UI-Framework | Vue 3 (`^3.5.34` als peerDependency) + [PrimeVue](https://primevue.org) 4.5 + Tailwind 4 |
| Graph-Engine | [BaklavaJS](https://baklava.tech) `^2.8.1` (`core`, `engine`, `interface-types`, `renderer-vue`, `themes`) |
| Distribution | npm-Bibliothek, Vite-Lib-Build (ESM + UMD), `vue` extern, CSS per JS injiziert |
| Einbettung | `<FlowPipeEditor />`-Komponente oder `FlowpipeEditorPlugin` als Vue-Plugin |
| Eingabe | Props `flowpipeNodes` (deserialisiertes Array) und `flowpipeJson` (String) |
| Lizenz | keine LICENSE-Datei im Repo |
| Codeumfang | ~300 Zeilen TS/Vue über 5 Komponenten + 1 Converter + 1 Typmodul |
| CI | GitHub Actions: `deploy.yml` (GitHub Pages) |

Kern: [`src/components/FlowPipeEditor.vue`](../src/components/FlowPipeEditor.vue), [`src/util/flowpipeBaklavaConverter.ts`](../src/util/flowpipeBaklavaConverter.ts)

**Architektonischer Kernunterschied:** Der Qt-Editor arbeitet direkt auf *Python-Objekten* (`INode`, `IPlug`, `Graph`) und hat damit Zugriff auf Docstrings, `file_location`, `evaluation_matrix` und die Live-Werte der Plugs. Der Web-Editor sieht nur die *serialisierte JSON-Form* ([`SerializedFlowpipeNode`](../src/types/flowpipe.ts)) und muss Typinformationen aus den Default-Werten erraten.

---

## 3. UI-Aufbau

### flowpipe-editor (Qt)

```
┌─────────────────────────────────────────────────────────────┐
│  QWidget (QHBoxLayout, margins 0)                           │
│ ┌─────────────────────────────────┬───────────────────────┐ │
│ │ QSplitter (horizontal)          │                       │ │
│ │                                 │  PropertiesBinWidget  │ │
│ │   NodeGraph.widget              │  ┌──────────────────┐ │ │
│ │   ┌───────┐      ┌───────┐      │  │ [2] [Lock][Clear]│ │ │
│ │   │ ICON  │─────▶│ ICON  │      │  ├──────────────────┤ │ │
│ │   │ Node  │      │ Node  │      │  │ Description      │ │ │
│ │   └───────┘      └───────┘      │  │ Inputs           │ │ │
│ │                                 │  │ Outputs          │ │ │
│ │   Rechtsklick → Kontextmenü     │  │ MetaData         │ │ │
│ │     └ Layout → Horizontal  ⇧1   │  │ Node             │ │ │
│ │              → Vertical    ⇧2   │  │ Ports            │ │ │
│ │                                 │  └──────────────────┘ │ │
│ └─────────────────────────────────┴───────────────────────┘ │
│   initial eingeklappt: setSizes([1, 0])                     │
└─────────────────────────────────────────────────────────────┘
```

Eigenheiten:

- **Zweigeteiltes Splitter-Layout** — Canvas links, Properties-Bin rechts, per Maus frei verschiebbar ([`flowpipe_editor_widget.py:49-76`](../../flowpipe-editor/flowpipe_editor/flowpipe_editor_widget.py#L49-L76)).
- Die Properties-Bin ist **initial eingeklappt** und fährt beim `node_selected`-Signal automatisch auf (`setSizes([700, 10])`), optional durch `expanded_properties=True` von Anfang an sichtbar.
- **Auto-Layout über das Graph-Kontextmenü**, Untermenü „Layout" mit `Shift+1` (downstream/horizontal) und `Shift+2` (upstream/vertikal); wirkt auf die Auswahl oder — falls leer — auf alle Nodes.
- **Dark Theme** über eine eigene `QPalette` in [`widgets/dark_theme.py`](../../flowpipe-editor/flowpipe_editor/widgets/dark_theme.py), angewandt auf Editor-Widget und Properties-Bin.
- **Interpreter-Icons:** `metadata["interpreter"]` wird auf `icons/<name>.png` gemappt (mitgeliefert: `maya`, `nuke`, `houdini`, `mari`, `3dequalizer`, `python`, `flowpipe`), Fallback ist `python.png`. Der Icon-Pfad `ICONS_PATH` ist zur Laufzeit überschreibbar.

**Properties-Bin im Detail** ([`node_property_widgets.py:195-246`](../../flowpipe-editor/flowpipe_editor/widgets/properties_bin/node_property_widgets.py#L195-L246)):

| Tab | Inhalt | Quelle |
|---|---|---|
| **Description** | Klassenname, Docstring (dedented), Button „Open Code" → öffnet `fp_node.file_location` | [`description.py`](../../flowpipe-editor/flowpipe_editor/widgets/properties_bin/description.py) |
| **Inputs** | je Input-Plug ein schreibgeschütztes Feld; `dict`-Werte als eingerücktes JSON | [`attributes_widget.py`](../../flowpipe-editor/flowpipe_editor/widgets/properties_bin/attributes_widget.py) |
| **Outputs** | dito für Output-Plugs | |
| **MetaData** | das `metadata`-Dict des Nodes | [`metadata_widget.py`](../../flowpipe-editor/flowpipe_editor/widgets/properties_bin/metadata_widget.py) |
| **Node** | `color`, `text_color`, `border_color`, `disabled`, `id` (editierbar, NodeGraphQt-Standard) | |
| **Ports** | Port-Verbindungsbaum mit Lock-Schaltern | |

Zusätzlich im Kopf der Bin: **Limit-SpinBox** (wie viele Nodes gleichzeitig angezeigt werden, Default 2, max 10), **Lock**-Button (verhindert das Nachladen neuer Nodes) und **Clear**-Button. Lange Plug-Werte lassen sich per **Doppelklick in einem 400×400-Popup** lesen ([`attribute_widgets.py:20-50`](../../flowpipe-editor/flowpipe_editor/widgets/properties_bin/attribute_widgets.py#L20-L50)).

### flowpipe-web-editor (Vue)

```
┌─────────────────────────────────────────────────────────────┐
│ TopBar  (h-80px, bg-surface-800, border-b)                  │
│  ⌗ Flowpipe Editor                            [  Save  ]    │
│                                       (Run: auskommentiert) │
├─────────────────────────────────────────────────────────────┤
│ canvas-area (flex-1, overflow-hidden)                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ GraphCanvas → <BaklavaEditor :view-model="baklava" />   │ │
│ │                                                         │ │
│ │  ┌─ Baklava-Palette ─┐          ┌─ Baklava-Toolbar ─┐   │ │
│ │  │ registrierte Node-│          │ Undo Redo Copy …  │   │ │
│ │  │ Typen (Drag&Drop) │          └───────────────────┘   │ │
│ │  └───────────────────┘                                  │ │
│ │                                                         │ │
│ │         (Canvas beim Start leer — siehe §5)             │ │
│ └─────────────────────────────────────────────────────────┘ │
│  RightSidebar:      auskommentiert                          │
│  NodeSearchDialog:  auskommentiert                          │
│  TabBar:            auskommentiert                          │
└─────────────────────────────────────────────────────────────┘
```

Eigenheiten:

- **Einspaltiges Layout**: Kopfzeile über vollflächiger Canvas. Alles, was der Qt-Editor rechts anbietet, ist hier entweder auskommentiert ([`FlowPipeEditor.vue:4-18`](../src/components/FlowPipeEditor.vue#L4-L18)) oder wird von Baklavas eigener Sidebar übernommen.
- Die TopBar ist bewusst minimal: **nur „Save"**, und auch nur, wenn ein `saveHandler`-Prop übergeben wurde. Der Run-Button ist auskommentiert ([`TopBar.vue:18-25`](../src/components/TopBar.vue#L18-L25)).
- **Doppelte Theme-Ebene:** Baklavas `syrup-dark.css` für die Canvas, PrimeVue-Preset `Aura` für die Chrome-Elemente, Tailwind-Utilities für das Layout ([`src/index.ts`](../src/index.ts)).
- **Baklava-Defaults sind aktiv**, weil die Overrides in [`GraphCanvas.vue:22-26`](../src/components/GraphCanvas.vue#L22-L26) auskommentiert sind: Node-Palette, Sidebar und Toolbar sind eingeschaltet, Minimap und `displayValueOnHover` bleiben aus.
- **Node-Widgets werden per Heuristik gewählt**: `boolean → CheckboxInterface`, `number → NumberInterface`, `string → TextInputInterface`, sonst leeres Textfeld ([`flowpipeBaklavaConverter.ts:6-19`](../src/util/flowpipeBaklavaConverter.ts#L6-L19)). Outputs bekommen bewusst kein interaktives Widget.

### Gegenüberstellung der UI-Konzepte

| | Qt | Web |
|---|---|---|
| Grundlayout | Splitter, zwei Spalten | Header + vollflächige Canvas |
| Node-Inspektion | dedizierte Properties-Bin mit 6 Tabs | Werte direkt im Node (Baklava-Interfaces) |
| Node-Erstellung | nicht vorgesehen | Baklava-Palette (Drag & Drop) |
| Aktionen | Kontextmenü + Shortcuts | Button-Leiste + Baklava-Toolbar |
| Theming | eine `QPalette` | drei Systeme (Baklava-Theme, PrimeVue, Tailwind) |
| Mehrere Graphen | nein | vorgesehen (TabBar), aber deaktiviert |

---

## 4. Feature-Übersicht

Legende: ✅ vorhanden · ⚠️ teilweise / durch das Framework vorhanden, aber nicht mit Flowpipe verdrahtet · ❌ fehlt

### 4.1 Graph-Darstellung

| Feature | Qt | Web | Anmerkung |
|---|:--:|:--:|---|
| Nodes auf der Canvas platzieren | ✅ | ❌ | Qt iteriert über `graph.evaluation_matrix` und platziert spaltenweise (x += 250, y += 150). Web registriert nur Node-*Typen*, erzeugt aber keine Instanzen. |
| Verbindungen aus dem Graph zeichnen | ✅ | ❌ | Qt löst `output.connections` auf Port-Indizes auf. Web wertet `plug.connections` nicht aus. |
| Node-Positionen aus `metadata.position` | ❌ | ❌ | Das Feld ist im Web-Typmodell definiert, wird aber nicht gelesen. |
| Auto-Layout | ✅ | ❌ | `auto_layout_nodes`, up- und downstream, per Kontextmenü und Shortcut. |
| Fit-to-View / Zoom-to-Fit | ✅ | ⚠️ | Qt: `center_on` + `fit_to_selection` nach dem Laden. Web: Baklava bringt `ZOOM_TO_FIT_*`-Commands mit, sie werden nicht explizit ausgelöst. |
| Pan / Zoom | ✅ | ✅ | beide Frameworks von Haus aus. |
| Minimap | ❌ | ⚠️ | `enableMinimap` existiert in Baklava, ist aber auskommentiert. |
| Icons je `interpreter` | ✅ | ❌ | Qt liefert 7 Icons mit; das Web-Typmodell kennt das Feld, nutzt es nicht. |
| Node-Farben pro Typ / Status | ⚠️ | ❌ | Qt: `color`/`text_color`/`border_color` im Node-Tab manuell editierbar, nicht automatisch gesetzt. |
| Gerade vs. Bezier-Kanten | ❌ | ⚠️ | Baklava-Setting `useStraightConnections` vorhanden, nicht konfiguriert. |

### 4.2 Editing

| Feature | Qt | Web | Anmerkung |
|---|:--:|:--:|---|
| Node hinzufügen | ❌ | ⚠️ | Qt ist ausdrücklich Viewer. Web: Die Baklava-Palette funktioniert, die Typen stammen aber aus dem übergebenen `flowpipeNodes`-Array, nicht aus einer Node-Registry. |
| Node löschen | ❌ | ⚠️ | Baklava: `DELETE_NODES_COMMAND`. |
| Verbindung ziehen / trennen | ❌ | ⚠️ | Baklava-Standard; ohne Rückschreiben in den Flowpipe-Graph. |
| Verbindungs-Typprüfung | ❌ | ❌ | Der `checkConnection`-Validator ist in [`GraphCanvas.vue:36-46`](../src/components/GraphCanvas.vue#L36-L46) auskommentiert. |
| Plug-Werte editieren | ❌ | ⚠️ | Qt setzt alle Plug-Felder explizit `setReadOnly(True)`. Web: Checkbox/Number/Text sind editierbar, die Werte landen aber nirgends. |
| Undo / Redo | ❌ | ⚠️ | Baklava: `UNDO_COMMAND` / `REDO_COMMAND` inkl. Transaktionen. |
| Copy / Paste | ❌ | ⚠️ | Baklava: `COPY_COMMAND` / `PASTE_COMMAND`. |
| Auswahlrahmen | ✅ | ⚠️ | Baklava: `START_SELECTION_BOX_COMMAND`. |
| Node umbenennen | ❌ | ⚠️ | |
| Subgraph aus Auswahl erzeugen | ❌ | ⚠️ | Baklava kann `CREATE_SUBGRAPH_COMMAND` / `SAVE_SUBGRAPH_COMMAND`, Flowpipe-Subgraphen sind damit aber nicht verknüpft. |

### 4.3 Node-Inspektion

| Feature | Qt | Web | Anmerkung |
|---|:--:|:--:|---|
| Docstring / Beschreibung | ✅ | ❌ | Qt liest `fp_node.__doc__`. Im serialisierten JSON ist der Docstring gar nicht enthalten. |
| Quellcode öffnen | ✅ | ❌ | „Open Code" öffnet `file_location`; der Button ist deaktiviert, wenn die Datei nicht existiert. |
| Input-Werte anzeigen | ✅ | ⚠️ | Qt: eigener Tab, JSON-formatiert für Dicts. Web: als Widget im Node selbst. |
| Output-Werte anzeigen | ✅ | ❌ | Web: Outputs bekommen bewusst kein Widget. |
| Metadata anzeigen | ✅ | ❌ | Web: wird in `onCreate` nur auf `this.flowpipe.metadata` abgelegt, nie dargestellt. |
| Sub-Plugs (`sub_plugs`) | ❌ | ❌ | Im Web-Typmodell definiert, in keiner UI sichtbar. |
| Lange Werte in Popup | ✅ | ❌ | `PopeUpLineEdit` + `PopupDialog`, 400×400, schreibgeschützt. |
| Mehrere Nodes gleichzeitig | ✅ | ❌ | Limit-SpinBox, Default 2. |
| Port-Verbindungsübersicht | ✅ | ❌ | „Ports"-Tab. |
| Werte beim Port-Hover | ❌ | ⚠️ | Baklava `displayValueOnHover`, auskommentiert. |

### 4.4 Persistenz

| Feature | Qt | Web | Anmerkung |
|---|:--:|:--:|---|
| Graph laden | ✅ | ❌ | Qt: `load_graph(Graph)`. Web: Der Prop `flowpipeJson` wird deklariert, aber nirgends ausgewertet ([`FlowPipeEditor.vue:30-39`](../src/components/FlowPipeEditor.vue#L30-L39)). |
| Nodes laden | ✅ | ⚠️ | Web nimmt `flowpipeNodes` entgegen und macht daraus Baklava-*Typdefinitionen*. |
| Graph speichern | ❌ | ❌ | Der `saveHandler` bekommt derzeit den Platzhalter `"{ 'test' : 'wasd' }"`; `baklavaToFlowpipeJson` existiert nicht ([`TopBar.vue:43-52`](../src/components/TopBar.vue#L43-L52)). |
| Round-Trip Flowpipe-JSON | ❌ | ❌ | In beiden Editoren fließt die Information nur in eine Richtung. |
| Datei-Dialog Laden/Speichern | ❌ | ❌ | Der Web-Editor delegiert das über `saveHandler` an den Host. |
| Graph leeren | ✅ | ❌ | `clear()` setzt Flowpipe-Graph und NodeGraphQt-Session zurück. |

### 4.5 Ausführung

| Feature | Qt | Web | Anmerkung |
|---|:--:|:--:|---|
| Graph ausführen | ❌ | ❌ | `Graph.evaluate()` wird von keinem Editor aufgerufen. |
| Run-Button | ❌ | ⚠️ | Im Web-Editor vorhanden, aber auskommentiert und mit einem 2-Sekunden-`setTimeout` als Attrappe. |
| Live-Status pro Node | ❌ | ❌ | |
| Fehleranzeige | ❌ | ❌ | |
| Backend-Anbindung | ❌ | ❌ | Das README beschreibt einen Backend-Proxy auf `localhost:8000` — im Code existiert er nicht (mehr). |

### 4.6 Integration & Distribution

| Feature | Qt | Web | Anmerkung |
|---|:--:|:--:|---|
| Als Bibliothek nutzbar | ✅ | ✅ | PyPI-Widget vs. npm-Komponente + Vue-Plugin. |
| Als eigenständige App | ⚠️ | ✅ | Qt: nur über die `examples/`. Web: `npm run dev`, plus GitHub-Pages-Deployment. |
| Beispiele | ✅ | ❌ | 7 lauffähige Beispiele (`birthday`, `house`, `nested_graphs`, `vfx_rendering`, `world_clock`, …). |
| Dark Theme | ✅ | ✅ | |
| Light Theme | ❌ | ❌ | |
| Tastenkürzel | ✅ | ⚠️ | Qt: `Shift+1`/`Shift+2` plus NodeGraphQt-Standards. Web: Baklava-Defaults, nichts Eigenes. |
| Node-Suchdialog | ⚠️ | ❌ | Qt: `toggle_node_search(graph)` als freistehende Hilfsfunktion, nirgends angebunden. Web: `NodeSearchDialog.vue` existiert, ist aber auskommentiert und nicht lauffähig (§5). |
| Mehrere Graphen / Tabs | ❌ | ❌ | Im Web-Editor vorgesehen, aber auskommentiert. |
| Linting / Formatierung | ✅ | ⚠️ | Qt: black, isort, pylint, mypy, pre-commit. Web: nur `vue-tsc` im Build. |
| Tests | ❌ | ❌ | Keines der beiden Projekte hat eine Testsuite. |

---

## 5. Offene Baustellen im Web-Editor

Beim Durchgehen des Codes sind drei Punkte aufgefallen, die über „noch nicht implementiert" hinausgehen:

1. **Der Lib-Build bricht.** [`src/index.ts:30`](../src/index.ts#L30) exportiert `FlowpipeNode` und `FlowpipeGraph`; [`src/types/flowpipe.ts`](../src/types/flowpipe.ts) definiert aber `SerializedFlowpipeNode` und `SerializedFlowpipeGraph`. `npm run build` führt `vue-tsc -b` aus und scheitert daran.

2. **`NodeSearchDialog.vue` ist verwaist.** Die Komponente importiert `../stores/nodeRegistryStore` und `../types/nodeRegistry` ([`NodeSearchDialog.vue:51-52`](../src/components/NodeSearchDialog.vue#L51-L52)) — beide Dateien wurden mit Commit `887f2ba` entfernt. Solange der Import in [`FlowPipeEditor.vue`](../src/components/FlowPipeEditor.vue) auskommentiert bleibt, fällt es nicht auf.

3. **Das README beschreibt einen anderen Editor.** [`README.md`](../README.md) dokumentiert Tabs, eine rechte Sidebar, Load/Save/Run, einen `Tab`-Suchdialog, `public/node-registry.json` und einen Backend-Proxy auf Port 8000. Nichts davon existiert im aktuellen Code. Auch die dort aufgeführten Shortcuts (`F`, `B`, `Ctrl+Z` …) sind Baklava-Defaults, keine projekteigenen Bindings.

Zum Startverhalten: [`App.vue`](../src/App.vue) rendert `<FlowPipeEditor/>` ohne Props. Damit ist `flowpipeNodes` das leere Default-Array, es wird kein Node-Typ registriert, und `npm run dev` zeigt eine leere Canvas mit leerer Palette. Auch mit übergebenen Nodes erschiene nichts auf der Canvas — es entstünden nur Einträge in der Palette.

---

## 6. Was in beiden Editoren fehlt

Abgeglichen mit der Flowpipe-Kern-API (`../../flowpipe/flowpipe/graph.py`, `node.py`, `plug.py`):

### Flowpipe-Konzepte ohne UI-Entsprechung

| Konzept | API | Status |
|---|---|---|
| **Subgraphen** | `Graph.subgraphs`, `SerializedFlowpipeGraph.subgraphs` | Beide Editoren stellen nur eine flache Ebene dar. Baklava könnte es technisch (`CREATE_SUBGRAPH_COMMAND`), Flowpipe-Subgraphen sind aber nicht damit verbunden. |
| **Input-Plug-Gruppen** | `Graph.input_groups`, `InputPlugGroup` | In keiner UI sichtbar. |
| **Sub-Plugs** | `plug.sub_plugs` | Im Web-Typmodell definiert, nirgends dargestellt. |
| **Promoted Graph-Plugs** | `Graph.add_plug()` | Ein Graph kann eigene Ein-/Ausgänge nach außen führen — von keiner UI abgebildet. |
| **Verbindungsvalidierung** | `Graph.accepts_connection()` | Zyklen- und Duplikatsprüfung steht in der Kern-API bereit, wird nicht genutzt. |
| **`evaluation_sequence`** | `Graph.evaluation_sequence` | Die Auswertungsreihenfolge wird nirgends visualisiert (Qt nutzt `evaluation_matrix` nur fürs initiale Layout). |
| **Dirty-State** | `INode.is_dirty` | Nicht dargestellt — kein Hinweis, welche Nodes neu berechnet werden müssten. |
| **ASCII-Repräsentation** | `Graph.node_repr()`, `list_repr()` | Flowpipe bringt eine eigene Textdarstellung mit, die in keiner UI als Ansicht oder Export angeboten wird. |

### Fehlende Editor-Funktionen (beidseitig)

- **Ausführung aus der UI heraus** — `Graph.evaluate()` (inkl. threaded/multiprocessing) mit Live-Status, Fortschritt und Fehlermarkierung pro Node.
- **Node-Bibliothek** — keiner der beiden Editoren kann neue Flowpipe-Nodes aus einer Registry erzeugen. Der Qt-Editor kann gar nichts anlegen; der Web-Editor kennt nur die Typen, die ihm der Host gerade übergeben hat.
- **Rück-Serialisierung** — kein Weg von der UI zurück zu `Graph.from_json()`. Beide Editoren sind Einbahnstraßen.
- **Suchen / Filtern im Graph** — bei Pipelines mit vielen Nodes (siehe `examples/vfx_rendering.py`) unverzichtbar.
- **Gruppierung, Backdrops, Bookmarks, Kommentare** — Standardmittel zur Strukturierung großer Graphen.
- **Diff / Versionsvergleich** zweier Graph-Stände.
- **Tests** — weder Unit- noch UI-Tests in einem der beiden Projekte.
- **Barrierefreiheit** — keine durchgängige Tastaturbedienung, keine ARIA-Auszeichnung (Web), keine Screenreader-Unterstützung.
- **Internationalisierung** — beide Oberflächen sind fest englisch.
- **Persistente Layout-Informationen** — wo ein Node liegt, überlebt in keinem der beiden Editoren einen Speichervorgang.

---

## 7. Fazit

Die beiden Projekte stehen an entgegengesetzten Enden:

**flowpipe-editor** ist ein ausgereifter, bewusst schreibgeschützter **Viewer**. Seine Stärke ist die Tiefe der Node-Introspektion — Docstring, Quellcode-Sprung, Inputs, Outputs, Metadata und Ports in einer aufgeräumten Tab-Struktur — und die Tatsache, dass er direkt auf lebenden Python-Objekten arbeitet. Was er nicht kann, kann er bewusst nicht: verändern.

**flowpipe-web-editor** bringt die Voraussetzungen für einen echten Editor mit — Baklava liefert Undo/Redo, Clipboard, Subgraphen, Auswahlrahmen und eine Node-Palette frei Haus, und die Auslieferung als npm-Bibliothek macht die Einbettung in beliebige Web-Anwendungen möglich. Aktuell fehlt jedoch das Bindeglied zu Flowpipe: Ein Graph wird weder in die Canvas geladen noch aus ihr zurückgeschrieben.

### Priorisierte nächste Schritte für den Web-Editor

1. **Build reparieren** — Typnamen in [`src/index.ts`](../src/index.ts) angleichen, verwaiste Imports in [`NodeSearchDialog.vue`](../src/components/NodeSearchDialog.vue) auflösen oder die Datei entfernen.
2. **Graph laden** — `flowpipeNodes` nicht nur als Typen registrieren, sondern Instanzen auf der Canvas erzeugen, `metadata.position` anwenden und Verbindungen aus `plug.connections` herstellen. Fällt keine Position an, kann ein Layout nach `evaluation_matrix` wie im Qt-Editor einspringen.
3. **`baklavaToFlowpipeJson` implementieren** — der Round-Trip ist die Bedingung dafür, dass „Save" mehr ist als ein Platzhalter.
4. **Node-Inspektion nachziehen** — die auskommentierte RightSidebar mit den Tabs des Qt-Editors als Vorbild füllen (Metadata, Outputs, vollständige Werte).
5. **Verbindungsvalidierung aktivieren** — den `checkConnection`-Validator einschalten und an `Graph.accepts_connection` ausrichten.
6. **Ausführung** — Run-Button an ein Backend anbinden, das `Graph.evaluate()` aufruft, mit Status-Rückmeldung pro Node.
7. **README aktualisieren** — es beschreibt derzeit Funktionen, die es nicht gibt.
