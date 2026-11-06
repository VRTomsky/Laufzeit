// C++ Abschnitt 12 bis 14: Raylib, Unreal-C++, Profi-Werkzeuge.
// Raylib- und Unreal-Code braucht eigene Bibliotheken bzw. ein Unreal-Projekt.
// Diese Aufgaben werden darum ueber Regeln geprueft (run: false), nicht ausgefuehrt.

import { concept, mc, predict, fill, order, write, cppFile } from './helpers.js';

const RAYLIB_START = '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Laufzeit");\n    SetTargetFPS(60);\n\n    while (!WindowShouldClose()) {\n        BeginDrawing();\n        ClearBackground(RAYWHITE);\n        DrawText("Hallo Raylib", 300, 200, 30, DARKGRAY);\n        EndDrawing();\n    }\n\n    CloseWindow();\n    return 0;\n}';

const COIN_START = '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Muenzen");\n    SetTargetFPS(60);\n    Rectangle spieler = {100, 200, 40, 40};\n    Rectangle muenze = {500, 200, 20, 20};\n    int punkte = 0;\n\n    while (!WindowShouldClose()) {\n        float dt = GetFrameTime();\n        if (IsKeyDown(KEY_RIGHT)) spieler.x += 300 * dt;\n        if (IsKeyDown(KEY_LEFT)) spieler.x -= 300 * dt;\n        if (IsKeyDown(KEY_DOWN)) spieler.y += 300 * dt;\n        if (IsKeyDown(KEY_UP)) spieler.y -= 300 * dt;\n\n        // Kollision und Punkte\n\n        BeginDrawing();\n        ClearBackground(RAYWHITE);\n        DrawRectangleRec(spieler, BLUE);\n        DrawRectangleRec(muenze, GOLD);\n        // Punktestand anzeigen\n        EndDrawing();\n    }\n    CloseWindow();\n    return 0;\n}';
const COIN_SOLUTION = COIN_START
  .replace('        // Kollision und Punkte\n', '        if (CheckCollisionRecs(spieler, muenze)) {\n            punkte++;\n            muenze.x = GetRandomValue(0, 780);\n            muenze.y = GetRandomValue(0, 430);\n        }\n')
  .replace('        // Punktestand anzeigen\n', '        DrawText(TextFormat("Punkte: %i", punkte), 10, 10, 20, BLACK);\n');

export const cppUnits12to14 = [
  /* ------------------------------------------------------------ 12 */
  {
    id: 'cpp12',
    title: 'Raylib',
    summary: 'Ein echtes Fenster, ein eigener Game-Loop, Tastatur und Zeichnen. Ausführen in VS Code nach der Anleitung in der Werkstatt.',
    lessons: [
      {
        id: 'cpp12-1',
        title: 'Das erste Fenster',
        goal: 'Den Aufbau eines Raylib-Programms verstehen.',
        steps: [
          concept('Raylib',
            '**Raylib** ist eine kleine Bibliothek für Spiele. Du schreibst den Game-Loop selbst, Raylib kümmert sich um Fenster, Grafik und Tastatur.\n\nRaylib-Code läuft nicht hier in Laufzeit, weil er ein echtes Fenster öffnet. Installiere Raylib nach Anleitung 05 in der Werkstatt. Hier lernst du den Aufbau, geprüft wird über Regeln.',
            { code: RAYLIB_START }),
          order('Bring den Ablauf in die richtige Reihenfolge.',
            ['InitWindow(800, 450, "Spiel");', 'while (!WindowShouldClose()) {', '    BeginDrawing();', '    ClearBackground(BLACK);', '    EndDrawing();', '}', 'CloseWindow();'],
            'Fenster öffnen, Schleife bis zum Schließen, pro Frame zeichnen, am Ende aufräumen.'),
          mc('Was macht `SetTargetFPS(60)`?', ['Begrenzt den Loop auf 60 Durchläufe pro Sekunde', 'Setzt die Fenstergröße', 'Startet 60 Fenster', 'Lädt 60 Bilder'], 0),
          mc('Warum steht `ClearBackground` am Anfang jedes Frames?', ['Sonst bleiben die Bilder der vorigen Frames stehen', 'Sonst stürzt Raylib ab', 'Damit das Fenster größer wird', 'Es ist optional und ohne Wirkung'], 0),
          fill('Ergänze die Schleifenbedingung.', 'while (⟦0⟧WindowShouldClose()) {\n    BeginDrawing();\n    EndDrawing();\n}', ['!'], ['!', '&', '*', 'not']),
        ],
      },
      {
        id: 'cpp12-2',
        title: 'Tastatur und Bewegung',
        goal: 'Eine Figur mit den Pfeiltasten steuern.',
        steps: [
          concept('Input, Update, Render',
            'Pro Frame fragst du mit `IsKeyDown(KEY_RIGHT)` die Tasten ab, bewegst die Figur mit Delta-Time aus `GetFrameTime()` und zeichnest sie mit `DrawCircle` oder `DrawRectangle`.',
            { code: 'Vector2 pos = {400, 225};\nfloat tempo = 250.0f;\n\nwhile (!WindowShouldClose()) {\n    float dt = GetFrameTime();\n    if (IsKeyDown(KEY_RIGHT)) pos.x += tempo * dt;\n    if (IsKeyDown(KEY_LEFT))  pos.x -= tempo * dt;\n\n    BeginDrawing();\n    ClearBackground(RAYWHITE);\n    DrawCircleV(pos, 20, MAROON);\n    EndDrawing();\n}' }),
          mc('Was ist der Unterschied zwischen `IsKeyDown` und `IsKeyPressed`?', ['IsKeyDown gilt, solange die Taste gehalten wird, IsKeyPressed nur im ersten Frame', 'Es gibt keinen', 'IsKeyPressed gilt nur für Buchstaben', 'IsKeyDown funktioniert nur unter Windows'], 0,
            'Laufen: IsKeyDown. Springen oder Menü öffnen: IsKeyPressed.'),
          fill('Bewege die Figur nach oben.', 'if (IsKeyDown(KEY_UP)) pos.y ⟦0⟧ tempo * ⟦1⟧;', ['-=', 'dt'], ['-=', '+=', 'dt', 'fps']),
          write('Schreib den Game-Loop einer Figur, die sich mit den Pfeiltasten links und rechts bewegt: `GetFrameTime()` für dt, `IsKeyDown` für beide Richtungen und `DrawCircle` oder `DrawCircleV` zum Zeichnen zwischen `BeginDrawing` und `EndDrawing`.\n\nGeprüft werden die Bausteine.',
            '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Steuerung");\n    SetTargetFPS(60);\n    float x = 400;\n\n    // Dein Game-Loop\n\n    CloseWindow();\n    return 0;\n}',
            { run: false, must: [[/while\s*\(\s*!\s*WindowShouldClose\s*\(\s*\)\s*\)/, 'Der Loop läuft mit `while (!WindowShouldClose())`.'], [/GetFrameTime\s*\(/, 'Hol dir dt mit `GetFrameTime()`.'], [/IsKeyDown\s*\(\s*KEY_RIGHT\s*\)/, 'Frag `IsKeyDown(KEY_RIGHT)` ab.'], [/IsKeyDown\s*\(\s*KEY_LEFT\s*\)/, 'Frag `IsKeyDown(KEY_LEFT)` ab.'], [/BeginDrawing\s*\([\s\S]*DrawCircle\w*\s*\([\s\S]*EndDrawing\s*\(/, 'Zeichne mit `DrawCircle` zwischen `BeginDrawing()` und `EndDrawing()`.']], solution: '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Steuerung");\n    SetTargetFPS(60);\n    float x = 400;\n\n    while (!WindowShouldClose()) {\n        float dt = GetFrameTime();\n        if (IsKeyDown(KEY_RIGHT)) x += 250 * dt;\n        if (IsKeyDown(KEY_LEFT)) x -= 250 * dt;\n\n        BeginDrawing();\n        ClearBackground(RAYWHITE);\n        DrawCircle((int)x, 225, 20, MAROON);\n        EndDrawing();\n    }\n\n    CloseWindow();\n    return 0;\n}' }),
        ],
      },
      {
        id: 'cpp12-3',
        title: 'Ein kleines Spiel',
        goal: 'Spieler, Münzen und Kollision zu einem Spiel verbinden.',
        steps: [
          concept('Münzen sammeln',
            'Ein vollständiges Mini-Spiel: Der Spieler ist ein Rechteck, die Münze auch. `CheckCollisionRecs` aus Raylib macht genau die AABB-Prüfung aus Abschnitt 11. Bei Kollision springt die Münze an einen neuen Zufallsort (`GetRandomValue`), und der Punktestand steigt.',
            { code: 'Rectangle spieler = {100, 200, 40, 40};\nRectangle muenze = {500, 200, 20, 20};\nint punkte = 0;\n\n// im Loop, nach der Bewegung:\nif (CheckCollisionRecs(spieler, muenze)) {\n    punkte++;\n    muenze.x = GetRandomValue(0, 780);\n    muenze.y = GetRandomValue(0, 430);\n}\nDrawText(TextFormat("Punkte: %i", punkte), 10, 10, 20, BLACK);' }),
          mc('Was liefert `CheckCollisionRecs(a, b)`?', ['true, wenn sich die Rechtecke überschneiden', 'Den Abstand der Rechtecke', 'Ein neues Rechteck', 'Die Punkte'], 0),
          mc('In welche Phase des Frames gehört die Kollisionsprüfung?', ['Update, nach der Bewegung', 'Render', 'Vor InitWindow', 'Nach CloseWindow'], 0),
          write('Schreib den Kern des Münz-Spiels in den Loop: Kollision mit `CheckCollisionRecs` prüfen, dann `punkte++` und die Münze mit `GetRandomValue` neu setzen, und den Punktestand mit `DrawText` anzeigen.\n\nGeprüft werden die Bausteine.',
            COIN_START,
            { run: false, must: [[/if\s*\(\s*CheckCollisionRecs\s*\(\s*spieler\s*,\s*muenze\s*\)\s*\)/, 'Prüfe mit `if (CheckCollisionRecs(spieler, muenze))`.'], [/punkte\s*(\+\+|\+=\s*1)/, 'Erhöhe `punkte`.'], [/GetRandomValue\s*\(/, 'Setz die Münze mit `GetRandomValue` neu.'], [/DrawText\s*\(/, 'Zeig die Punkte mit `DrawText` an.']], solution: COIN_SOLUTION, explain: 'Kopier das Programm in VS Code, kompiliere es mit Raylib und spiel es. Das ist dein erstes eigenes Spiel.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 13 */
  {
    id: 'cpp13',
    title: 'Unreal-C++',
    summary: 'Klassen, Makros und Tick in Unreal Engine 5. Alles, was du bis hier gelernt hast, kommt zusammen.',
    lessons: [
      {
        id: 'cpp13-1',
        title: 'UCLASS und UPROPERTY',
        goal: 'Die Makros verstehen, mit denen Unreal deine Klassen kennt.',
        steps: [
          concept('Ein Actor in Unreal',
            'Eine Unreal-Klasse ist normales C++ plus ein paar **Makros**: Zeilen in Großbuchstaben, die Unreals Werkzeug (Unreal Header Tool) vor dem Kompilieren liest.\n\n- `UCLASS()`: Unreal kennt diese Klasse, z. B. im Editor\n- `GENERATED_BODY()`: hier fügt Unreal eigenen Code ein\n- `UPROPERTY(EditAnywhere)`: Der Wert erscheint im Editor und lässt sich dort einstellen\n\nDie Namen haben Präfixe: `A` für Actors, `U` für andere Objekte, `F` für einfache Strukturen wie `FVector`.',
            { code: '#pragma once\n\n#include "CoreMinimal.h"\n#include "GameFramework/Actor.h"\n#include "Muenze.generated.h"\n\nUCLASS()\nclass MEINSPIEL_API AMuenze : public AActor\n{\n    GENERATED_BODY()\n\npublic:\n    AMuenze();\n\n    UPROPERTY(EditAnywhere, Category = "Muenze")\n    int32 Wert = 10;\n\n    UPROPERTY(EditAnywhere, Category = "Muenze")\n    float Drehtempo = 90.f;\n\nprotected:\n    virtual void BeginPlay() override;\n\npublic:\n    virtual void Tick(float DeltaTime) override;\n};' }),
          mc('Was bewirkt `UPROPERTY(EditAnywhere)`?', ['Der Wert lässt sich im Unreal-Editor einstellen', 'Der Wert wird verschlüsselt', 'Die Variable wird global', 'Der Wert ist schreibgeschützt'], 0),
          mc('Wofür steht das `A` in `AMuenze`?', ['Die Klasse ist ein Actor, also ein Objekt in der Spielwelt', 'Abstrakt', 'Array', 'Automatisch'], 0),
          fill('Ergänze die Makros.', '⟦0⟧()\nclass AFalle : public AActor\n{\n    ⟦1⟧()\n};', ['UCLASS', 'GENERATED_BODY'], ['UCLASS', 'GENERATED_BODY', 'UFUNCTION', 'USTRUCT']),
          mc('Warum stehen `BeginPlay` und `Tick` mit `virtual ... override` in der Klasse?', ['Sie überschreiben virtuelle Methoden von AActor, die die Engine aufruft', 'Weil Makros das verlangen', 'Damit sie privat sind', 'Das ist nur Stil'], 0,
            'Genau das Prinzip aus Abschnitt 10: Unreal hat eine Liste von AActor-Pointern und ruft auf jedem Tick auf.'),
        ],
      },
      {
        id: 'cpp13-2',
        title: 'BeginPlay und Tick',
        goal: 'Code beim Start und in jedem Frame ausführen.',
        steps: [
          concept('Wann läuft was?',
            '- **Konstruktor**: wenn Unreal das Objekt anlegt, auch im Editor. Hier Komponenten erstellen\n- **BeginPlay()**: einmal, wenn das Spiel startet oder der Actor erscheint\n- **Tick(float DeltaTime)**: in jedem Frame. Hier läuft der Update-Teil deines Game-Loops\n\nIn der `.cpp`-Datei schreibst du die Definitionen mit `AMuenze::`. `Super::Tick(DeltaTime)` ruft erst die Version der Basisklasse auf.',
            { code: '#include "Muenze.h"\n\nAMuenze::AMuenze()\n{\n    PrimaryActorTick.bCanEverTick = true;\n}\n\nvoid AMuenze::BeginPlay()\n{\n    Super::BeginPlay();\n    UE_LOG(LogTemp, Warning, TEXT("Muenze bereit, Wert %d"), Wert);\n}\n\nvoid AMuenze::Tick(float DeltaTime)\n{\n    Super::Tick(DeltaTime);\n    AddActorLocalRotation(FRotator(0.f, Drehtempo * DeltaTime, 0.f));\n}' }),
          mc('Wo gehört Code hin, der genau einmal beim Spielstart laufen soll?', ['BeginPlay', 'Tick', 'Destruktor', 'In jedes Makro'], 0),
          mc('Was passiert ohne `PrimaryActorTick.bCanEverTick = true;`?', ['Tick wird nie aufgerufen', 'Das Spiel stürzt ab', 'BeginPlay läuft doppelt', 'Nichts, das ist Standard'], 0),
          order('Bring die Tick-Funktion in die richtige Reihenfolge.',
            ['void AMuenze::Tick(float DeltaTime)', '{', '    Super::Tick(DeltaTime);', '    AddActorLocalRotation(FRotator(0.f, Drehtempo * DeltaTime, 0.f));', '}']),
          write('Schreib `Tick` für einen Actor `AAufzug`, der mit `Tempo` (float, Einheiten pro Sekunde) nach oben fährt. Ruf zuerst `Super::Tick` auf und bewege dann mit `AddActorLocalOffset(FVector(0.f, 0.f, ...))` unter Verwendung von `DeltaTime`.\n\nGeprüft werden die Bausteine.',
            'void AAufzug::Tick(float DeltaTime)\n{\n    \n}',
            { run: false, must: [[/Super::Tick\s*\(\s*DeltaTime\s*\)/, 'Ruf zuerst `Super::Tick(DeltaTime);` auf.'], [/AddActorLocalOffset\s*\(\s*FVector\s*\(/, 'Bewege mit `AddActorLocalOffset(FVector(...))`.'], [/Tempo\s*\*\s*DeltaTime|DeltaTime\s*\*\s*Tempo/, 'Multipliziere `Tempo * DeltaTime`, damit es auf jedem PC gleich schnell ist.']], solution: 'void AAufzug::Tick(float DeltaTime)\n{\n    Super::Tick(DeltaTime);\n    AddActorLocalOffset(FVector(0.f, 0.f, Tempo * DeltaTime));\n}' }),
        ],
      },
      {
        id: 'cpp13-3',
        title: 'Komponenten und Blueprints',
        goal: 'Actors aus Komponenten bauen und C++ mit Blueprints verbinden.',
        steps: [
          concept('Komponenten',
            'Ein Actor besteht aus **Komponenten**: ein Mesh zum Anzeigen, eine Kollisionsform, ein Sound. Du erstellst sie im Konstruktor mit `CreateDefaultSubobject`.\n\nMit `UFUNCTION(BlueprintCallable)` wird eine C++-Funktion in **Blueprints** sichtbar, Unreals visueller Programmierung. Typischer Profi-Weg: schwere Logik in C++, Feinschliff und Design in Blueprints.',
            { code: 'UPROPERTY(VisibleAnywhere)\nUStaticMeshComponent* Mesh;\n\nAMuenze::AMuenze()\n{\n    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));\n    RootComponent = Mesh;\n}\n\nUFUNCTION(BlueprintCallable, Category = "Muenze")\nvoid Einsammeln();' }),
          mc('Warum ist `Mesh` ein Pointer (`UStaticMeshComponent*`)?', ['Unreal legt Komponenten selbst im Speicher an und verwaltet sie', 'Pointer sind schneller zu tippen', 'Weil Meshes Zahlen sind', 'Das ist Pflicht bei jedem int'], 0,
            'Hier zahlt sich Abschnitt 7 und 8 aus: Unreal arbeitet überall mit Pointern auf Objekte, die die Engine verwaltet.'),
          fill('Mach die Funktion in Blueprints aufrufbar.', '⟦0⟧(⟦1⟧, Category = "Spiel")\nvoid Explodieren();', ['UFUNCTION', 'BlueprintCallable'], ['UFUNCTION', 'BlueprintCallable', 'UPROPERTY', 'EditAnywhere']),
          mc('Was ist ein guter Grund, Logik in C++ statt nur in Blueprints zu schreiben?', ['Performance und saubere Struktur bei komplexer Logik', 'Blueprints können keine Variablen', 'C++ braucht keinen Compiler', 'Blueprints laufen nur im Editor'], 0),
          concept('Dein nächster Schritt in Unreal',
            'Öffne Unreal 5 über den Epic Games Launcher, lege ein **C++-Projekt** an (Vorlage Third Person) und erstelle über **Tools, Neue C++-Klasse** einen eigenen Actor. Übernimm `AMuenze` aus dieser Lektion: Sie dreht sich und zeigt beim Start eine Meldung im Output-Log.\n\nAnleitung 06 in der Werkstatt führt dich durch die Einrichtung.'),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 14 */
  {
    id: 'cpp14',
    title: 'Profi-Werkzeuge',
    summary: 'Templates, STL-Algorithmen, Lambdas und schnelles C++ ohne unnötige Kopien.',
    lessons: [
      {
        id: 'cpp14-1',
        title: 'Templates',
        goal: 'Funktionen schreiben, die mit jedem Typ funktionieren.',
        steps: [
          concept('Code für alle Typen',
            'Ein **Template** ist eine Vorlage. Statt `groesser` für int, double und float einzeln zu schreiben, schreibst du es einmal mit einem Platzhalter-Typ `T`. Der Compiler erzeugt die passenden Versionen.\n\n`std::vector<int>` ist übrigens selbst ein Template, genau wie `TArray<int32>` in Unreal.',
            { code: 'template <typename T>\nT groesser(T a, T b) {\n    return a > b ? a : b;\n}\n\n// groesser(3, 9)      -> 9\n// groesser(2.5, 1.5)  -> 2.5' }),
          mc('Was bedeutet `a > b ? a : b`?', ['Wenn a größer ist, a, sonst b', 'a mal b', 'Eine Fehlermeldung', 'a geteilt durch b'], 0, 'Das ist der **ternäre Operator**, eine Kurzform von if/else.'),
          predict('Was gibt dieser Code aus?', cppFile('template <typename T>\nT doppelt(T x) {\n    return x * 2;\n}', 'std::cout << doppelt(4) << " " << doppelt(1.5) << std::endl;'), '8 3'),
          write('Schreib ein Template `T groesser(T a, T b)`. Gib `groesser(3, 9)` und `groesser(2.5, 1.5)` aus, jeweils in eigener Zeile.',
            cppFile('', ''),
            { expect: '9\n2.5', must: [[/template\s*<\s*(typename|class)\s+T\s*>/, 'Beginne mit `template <typename T>`.']], solution: cppFile('template <typename T>\nT groesser(T a, T b) {\n    return a > b ? a : b;\n}', 'std::cout << groesser(3, 9) << std::endl;\nstd::cout << groesser(2.5, 1.5) << std::endl;') }),
        ],
      },
      {
        id: 'cpp14-2',
        title: 'STL-Algorithmen und Lambdas',
        goal: 'Sortieren und Suchen mit der Standardbibliothek.',
        steps: [
          concept('Fertige Algorithmen',
            '`#include <algorithm>` bringt geprüfte, schnelle Algorithmen:\n\n- `std::sort(v.begin(), v.end())`: sortieren\n- `std::find(v.begin(), v.end(), x)`: suchen\n- `std::count_if(...)`: zählen mit Bedingung\n\nEin **Lambda** ist eine kleine Funktion direkt an Ort und Stelle: `[](int a, int b) { return a > b; }`. Damit sagst du z. B. `sort`, wie sortiert werden soll.',
            { code: 'std::vector<int> v = {5, 2, 9, 1};\nstd::sort(v.begin(), v.end(), [](int a, int b) {\n    return a > b;    // absteigend\n});\n// v ist jetzt 9 5 2 1' }),
          predict('Was gibt dieser Code aus?', 'std::vector<int> hp = {30, 0, 12, 0, 7};\nint tot = std::count_if(hp.begin(), hp.end(), [](int x) { return x == 0; });\nstd::cout << tot << std::endl;', '2'),
          mc('Was steht in den eckigen Klammern `[]` eines Lambdas?', ['Welche Variablen von außen es benutzen darf', 'Der Rückgabetyp', 'Die Parameter', 'Der Name'], 0),
          write('Sortiere `std::vector<int> punkte = {5, 2, 9, 1};` mit `std::sort` und einem Lambda **absteigend** und gib jede Zahl in einer eigenen Zeile aus.',
            cppFile('', 'std::vector<int> punkte = {5, 2, 9, 1};\n', ['iostream', 'vector', 'algorithm']),
            { expect: '9\n5\n2\n1', must: [[/std::sort\s*\(/, 'Nutze `std::sort`.'], [/\[\s*[&=]?\s*\]\s*\(/, 'Gib `sort` ein Lambda `[](int a, int b) { ... }` mit.']], solution: cppFile('', 'std::vector<int> punkte = {5, 2, 9, 1};\nstd::sort(punkte.begin(), punkte.end(), [](int a, int b) {\n    return a > b;\n});\nfor (int p : punkte) {\n    std::cout << p << std::endl;\n}', ['iostream', 'vector', 'algorithm']) }),
        ],
      },
      {
        id: 'cpp14-3',
        title: 'Schnelles C++',
        goal: 'Kopien vermeiden und Speicher klug nutzen.',
        steps: [
          concept('Keine unnötigen Kopien',
            'In Spielen zählt jede Millisekunde, bei 60 FPS bleiben 16 pro Frame. Drei Profi-Regeln:\n\n- Große Objekte als `const T&` übergeben, nicht als Kopie\n- `v.reserve(n)`: Platz vorab reservieren, wenn du weißt, wie viel kommt\n- `std::move(x)`: Besitz übergeben statt kopieren, z. B. bei `unique_ptr`\n\nDazu: Daten, die zusammen benutzt werden, liegen besser direkt hintereinander im Speicher. Deshalb ist `std::vector` fast immer schneller als verkettete Listen.',
            { code: 'int summe(const std::vector<int>& werte) {   // keine Kopie\n    int s = 0;\n    for (int w : werte) s += w;\n    return s;\n}\n\nstd::vector<int> v;\nv.reserve(1000);     // einmal Speicher holen statt oft' }),
          mc('Warum `const std::vector<int>&` statt `std::vector<int>` als Parameter?', ['Es wird nichts kopiert, und const verhindert Änderungen', 'Damit der Vektor größer wird', 'Weil & schneller zu tippen ist', 'Es gibt keinen Unterschied'], 0),
          mc('Wozu dient `std::move` bei einem `unique_ptr`?', ['Der Besitz geht an einen neuen Besitzer über, der alte ist danach leer', 'Der Speicher wird kopiert', 'Das Objekt wird gelöscht', 'Es verschiebt das Fenster'], 0,
            'Ein unique_ptr darf nur einen Besitzer haben. Kopieren verbietet der Compiler, verschieben ist erlaubt.'),
          write('Schreib `int summe(const std::vector<int>& werte)` und gib die Summe von `{1, 2, 3, 4, 5}` aus.',
            cppFile('', '', ['iostream', 'vector']),
            { expect: '15', must: [[/int\s+summe\s*\(\s*const\s+std::vector\s*<\s*int\s*>\s*&/, 'Der Parameter ist `const std::vector<int>& werte`.']], solution: cppFile('int summe(const std::vector<int>& werte) {\n    int s = 0;\n    for (int w : werte) s += w;\n    return s;\n}', 'std::cout << summe({1, 2, 3, 4, 5}) << std::endl;', ['iostream', 'vector']), explain: 'Damit hast du den C++-Pfad komplett: von main() bis zu Profi-Techniken. Weiter geht es in Unreal, im Labor und im Training.' }),
        ],
      },
    ],
  },
];
