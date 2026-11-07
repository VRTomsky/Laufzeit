// C++ units 12 to 14 (English): Raylib, Unreal C++, pro tools.
// Raylib and Unreal code needs its own libraries or an Unreal project.
// These tasks are therefore checked by rules (run: false), not executed.

import { concept, mc, predict, fill, order, write, cppFile } from '../helpers.js';

const RAYLIB_START = '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Laufzeit");\n    SetTargetFPS(60);\n\n    while (!WindowShouldClose()) {\n        BeginDrawing();\n        ClearBackground(RAYWHITE);\n        DrawText("Hello Raylib", 300, 200, 30, DARKGRAY);\n        EndDrawing();\n    }\n\n    CloseWindow();\n    return 0;\n}';

const COIN_START = '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Coins");\n    SetTargetFPS(60);\n    Rectangle player = {100, 200, 40, 40};\n    Rectangle coin = {500, 200, 20, 20};\n    int points = 0;\n\n    while (!WindowShouldClose()) {\n        float dt = GetFrameTime();\n        if (IsKeyDown(KEY_RIGHT)) player.x += 300 * dt;\n        if (IsKeyDown(KEY_LEFT)) player.x -= 300 * dt;\n        if (IsKeyDown(KEY_DOWN)) player.y += 300 * dt;\n        if (IsKeyDown(KEY_UP)) player.y -= 300 * dt;\n\n        // collision and points\n\n        BeginDrawing();\n        ClearBackground(RAYWHITE);\n        DrawRectangleRec(player, BLUE);\n        DrawRectangleRec(coin, GOLD);\n        // show the score\n        EndDrawing();\n    }\n    CloseWindow();\n    return 0;\n}';
const COIN_SOLUTION = COIN_START
  .replace('        // collision and points\n', '        if (CheckCollisionRecs(player, coin)) {\n            points++;\n            coin.x = GetRandomValue(0, 780);\n            coin.y = GetRandomValue(0, 430);\n        }\n')
  .replace('        // show the score\n', '        DrawText(TextFormat("Points: %i", points), 10, 10, 20, BLACK);\n');

export const cppUnits12to14 = [
  /* ------------------------------------------------------------ 12 */
  {
    id: 'cpp12',
    title: 'Raylib',
    summary: 'A real window, your own game loop, keyboard and drawing. Run it in VS Code following the guide in the Workshop.',
    lessons: [
      {
        id: 'cpp12-1',
        title: 'The first window',
        goal: 'Understand the structure of a Raylib program.',
        steps: [
          concept('Raylib',
            '**Raylib** is a small library for games. You write the game loop yourself, Raylib takes care of the window, graphics and keyboard.\n\nRaylib code doesn\'t run here in Laufzeit, because it opens a real window. Install Raylib following guide 05 in the Workshop. Here you learn the structure, checked by rules.',
            { code: RAYLIB_START }),
          order('Put the flow in the right order.',
            ['InitWindow(800, 450, "Game");', 'while (!WindowShouldClose()) {', '    BeginDrawing();', '    ClearBackground(BLACK);', '    EndDrawing();', '}', 'CloseWindow();'],
            'Open the window, loop until it is closed, draw each frame, clean up at the end.'),
          mc('What does `SetTargetFPS(60)` do?', ['Limits the loop to 60 runs per second', 'Sets the window size', 'Starts 60 windows', 'Loads 60 images'], 0),
          mc('Why does `ClearBackground` come at the start of every frame?', ['Otherwise the pictures of previous frames stay visible', 'Otherwise Raylib crashes', 'So the window gets bigger', 'It is optional and has no effect'], 0),
          fill('Complete the loop condition.', 'while (⟦0⟧WindowShouldClose()) {\n    BeginDrawing();\n    EndDrawing();\n}', ['!'], ['!', '&', '*', 'not']),
        ],
      },
      {
        id: 'cpp12-2',
        title: 'Keyboard and movement',
        goal: 'Control a character with the arrow keys.',
        steps: [
          concept('Input, update, render',
            'Every frame you check the keys with `IsKeyDown(KEY_RIGHT)`, move the character with the delta time from `GetFrameTime()` and draw it with `DrawCircle` or `DrawRectangle`.',
            { code: 'Vector2 pos = {400, 225};\nfloat speed = 250.0f;\n\nwhile (!WindowShouldClose()) {\n    float dt = GetFrameTime();\n    if (IsKeyDown(KEY_RIGHT)) pos.x += speed * dt;\n    if (IsKeyDown(KEY_LEFT))  pos.x -= speed * dt;\n\n    BeginDrawing();\n    ClearBackground(RAYWHITE);\n    DrawCircleV(pos, 20, MAROON);\n    EndDrawing();\n}' }),
          mc('What is the difference between `IsKeyDown` and `IsKeyPressed`?', ['IsKeyDown holds as long as the key is held, IsKeyPressed only in the first frame', 'There is none', 'IsKeyPressed only works for letters', 'IsKeyDown only works on Windows'], 0,
            'Walking: IsKeyDown. Jumping or opening a menu: IsKeyPressed.'),
          fill('Move the character up.', 'if (IsKeyDown(KEY_UP)) pos.y ⟦0⟧ speed * ⟦1⟧;', ['-=', 'dt'], ['-=', '+=', 'dt', 'fps']),
          write('Write the game loop of a character that moves left and right with the arrow keys: `GetFrameTime()` for dt, `IsKeyDown` for both directions and `DrawCircle` or `DrawCircleV` to draw between `BeginDrawing` and `EndDrawing`.\n\nThe building blocks are checked.',
            '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Controls");\n    SetTargetFPS(60);\n    float x = 400;\n\n    // Your game loop\n\n    CloseWindow();\n    return 0;\n}',
            { run: false, must: [[/while\s*\(\s*!\s*WindowShouldClose\s*\(\s*\)\s*\)/, 'The loop runs with `while (!WindowShouldClose())`.'], [/GetFrameTime\s*\(/, 'Get dt with `GetFrameTime()`.'], [/IsKeyDown\s*\(\s*KEY_RIGHT\s*\)/, 'Check `IsKeyDown(KEY_RIGHT)`.'], [/IsKeyDown\s*\(\s*KEY_LEFT\s*\)/, 'Check `IsKeyDown(KEY_LEFT)`.'], [/BeginDrawing\s*\([\s\S]*DrawCircle\w*\s*\([\s\S]*EndDrawing\s*\(/, 'Draw with `DrawCircle` between `BeginDrawing()` and `EndDrawing()`.']], solution: '#include "raylib.h"\n\nint main() {\n    InitWindow(800, 450, "Controls");\n    SetTargetFPS(60);\n    float x = 400;\n\n    while (!WindowShouldClose()) {\n        float dt = GetFrameTime();\n        if (IsKeyDown(KEY_RIGHT)) x += 250 * dt;\n        if (IsKeyDown(KEY_LEFT)) x -= 250 * dt;\n\n        BeginDrawing();\n        ClearBackground(RAYWHITE);\n        DrawCircle((int)x, 225, 20, MAROON);\n        EndDrawing();\n    }\n\n    CloseWindow();\n    return 0;\n}' }),
        ],
      },
      {
        id: 'cpp12-3',
        title: 'A small game',
        goal: 'Combine player, coins and collision into a game.',
        steps: [
          concept('Collecting coins',
            'A complete mini game: the player is a rectangle, so is the coin. `CheckCollisionRecs` from Raylib does exactly the AABB check from unit 11. On collision the coin jumps to a new random place (`GetRandomValue`), and the score goes up.',
            { code: 'Rectangle player = {100, 200, 40, 40};\nRectangle coin = {500, 200, 20, 20};\nint points = 0;\n\n// in the loop, after moving:\nif (CheckCollisionRecs(player, coin)) {\n    points++;\n    coin.x = GetRandomValue(0, 780);\n    coin.y = GetRandomValue(0, 430);\n}\nDrawText(TextFormat("Points: %i", points), 10, 10, 20, BLACK);' }),
          mc('What does `CheckCollisionRecs(a, b)` return?', ['true if the rectangles overlap', 'The distance between the rectangles', 'A new rectangle', 'The points'], 0),
          mc('Which phase of the frame does the collision check belong to?', ['Update, after moving', 'Render', 'Before InitWindow', 'After CloseWindow'], 0),
          write('Write the core of the coin game in the loop: check the collision with `CheckCollisionRecs`, then `points++` and move the coin with `GetRandomValue`, and show the score with `DrawText`.\n\nThe building blocks are checked.',
            COIN_START,
            { run: false, must: [[/if\s*\(\s*CheckCollisionRecs\s*\(\s*player\s*,\s*coin\s*\)\s*\)/, 'Check with `if (CheckCollisionRecs(player, coin))`.'], [/points\s*(\+\+|\+=\s*1)/, 'Increase `points`.'], [/GetRandomValue\s*\(/, 'Move the coin with `GetRandomValue`.'], [/DrawText\s*\(/, 'Show the points with `DrawText`.']], solution: COIN_SOLUTION, explain: 'Copy the program into VS Code, compile it with Raylib and play it. This is your first own game.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 13 */
  {
    id: 'cpp13',
    title: 'Unreal C++',
    summary: 'Classes, macros and Tick in Unreal Engine 5. Everything you have learned so far comes together.',
    lessons: [
      {
        id: 'cpp13-1',
        title: 'UCLASS and UPROPERTY',
        goal: 'Understand the macros through which Unreal knows your classes.',
        steps: [
          concept('An actor in Unreal',
            'An Unreal class is normal C++ plus a few **macros**: lines in capital letters that Unreal\'s tool (Unreal Header Tool) reads before compiling.\n\n- `UCLASS()`: Unreal knows this class, e.g. in the editor\n- `GENERATED_BODY()`: Unreal inserts its own code here\n- `UPROPERTY(EditAnywhere)`: the value appears in the editor and can be set there\n\nThe names have prefixes: `A` for actors, `U` for other objects, `F` for simple structures like `FVector`.',
            { code: '#pragma once\n\n#include "CoreMinimal.h"\n#include "GameFramework/Actor.h"\n#include "Coin.generated.h"\n\nUCLASS()\nclass MYGAME_API ACoin : public AActor\n{\n    GENERATED_BODY()\n\npublic:\n    ACoin();\n\n    UPROPERTY(EditAnywhere, Category = "Coin")\n    int32 Value = 10;\n\n    UPROPERTY(EditAnywhere, Category = "Coin")\n    float SpinSpeed = 90.f;\n\nprotected:\n    virtual void BeginPlay() override;\n\npublic:\n    virtual void Tick(float DeltaTime) override;\n};' }),
          mc('What does `UPROPERTY(EditAnywhere)` do?', ['The value can be set in the Unreal editor', 'The value is encrypted', 'The variable becomes global', 'The value is read-only'], 0),
          mc('What does the `A` in `ACoin` stand for?', ['The class is an actor, an object in the game world', 'Abstract', 'Array', 'Automatic'], 0),
          fill('Complete the macros.', '⟦0⟧()\nclass ATrap : public AActor\n{\n    ⟦1⟧()\n};', ['UCLASS', 'GENERATED_BODY'], ['UCLASS', 'GENERATED_BODY', 'UFUNCTION', 'USTRUCT']),
          mc('Why are `BeginPlay` and `Tick` in the class with `virtual ... override`?', ['They override virtual methods of AActor that the engine calls', 'Because macros require it', 'So they are private', 'It is just style'], 0,
            'Exactly the principle from unit 10: Unreal has a list of AActor pointers and calls Tick on each one.'),
        ],
      },
      {
        id: 'cpp13-2',
        title: 'BeginPlay and Tick',
        goal: 'Run code at the start and every frame.',
        steps: [
          concept('What runs when?',
            '- **Constructor**: when Unreal creates the object, also in the editor. Create components here\n- **BeginPlay()**: once, when the game starts or the actor appears\n- **Tick(float DeltaTime)**: every frame. This is where the update part of your game loop runs\n\nIn the `.cpp` file you write the definitions with `ACoin::`. `Super::Tick(DeltaTime)` first calls the base class version.',
            { code: '#include "Coin.h"\n\nACoin::ACoin()\n{\n    PrimaryActorTick.bCanEverTick = true;\n}\n\nvoid ACoin::BeginPlay()\n{\n    Super::BeginPlay();\n    UE_LOG(LogTemp, Warning, TEXT("Coin ready, value %d"), Value);\n}\n\nvoid ACoin::Tick(float DeltaTime)\n{\n    Super::Tick(DeltaTime);\n    AddActorLocalRotation(FRotator(0.f, SpinSpeed * DeltaTime, 0.f));\n}' }),
          mc('Where does code go that should run exactly once when the game starts?', ['BeginPlay', 'Tick', 'Destructor', 'Into every macro'], 0),
          mc('What happens without `PrimaryActorTick.bCanEverTick = true;`?', ['Tick is never called', 'The game crashes', 'BeginPlay runs twice', 'Nothing, it is the default'], 0),
          order('Put the Tick function in the right order.',
            ['void ACoin::Tick(float DeltaTime)', '{', '    Super::Tick(DeltaTime);', '    AddActorLocalRotation(FRotator(0.f, SpinSpeed * DeltaTime, 0.f));', '}']),
          write('Write `Tick` for an actor `AElevator` that moves up at `Speed` (float, units per second). First call `Super::Tick`, then move with `AddActorLocalOffset(FVector(0.f, 0.f, ...))` using `DeltaTime`.\n\nThe building blocks are checked.',
            'void AElevator::Tick(float DeltaTime)\n{\n    \n}',
            { run: false, must: [[/Super::Tick\s*\(\s*DeltaTime\s*\)/, 'First call `Super::Tick(DeltaTime);`.'], [/AddActorLocalOffset\s*\(\s*FVector\s*\(/, 'Move with `AddActorLocalOffset(FVector(...))`.'], [/Speed\s*\*\s*DeltaTime|DeltaTime\s*\*\s*Speed/, 'Multiply `Speed * DeltaTime` so it is equally fast on every PC.']], solution: 'void AElevator::Tick(float DeltaTime)\n{\n    Super::Tick(DeltaTime);\n    AddActorLocalOffset(FVector(0.f, 0.f, Speed * DeltaTime));\n}' }),
        ],
      },
      {
        id: 'cpp13-3',
        title: 'Components and Blueprints',
        goal: 'Build actors from components and connect C++ with Blueprints.',
        steps: [
          concept('Components',
            'An actor consists of **components**: a mesh to display, a collision shape, a sound. You create them in the constructor with `CreateDefaultSubobject`.\n\nWith `UFUNCTION(BlueprintCallable)` a C++ function becomes visible in **Blueprints**, Unreal\'s visual programming. The typical pro way: heavy logic in C++, polish and design in Blueprints.',
            { code: 'UPROPERTY(VisibleAnywhere)\nUStaticMeshComponent* Mesh;\n\nACoin::ACoin()\n{\n    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));\n    RootComponent = Mesh;\n}\n\nUFUNCTION(BlueprintCallable, Category = "Coin")\nvoid Collect();' }),
          mc('Why is `Mesh` a pointer (`UStaticMeshComponent*`)?', ['Unreal creates and manages components in memory itself', 'Pointers are faster to type', 'Because meshes are numbers', 'It is required for every int'], 0,
            'This is where units 7 and 8 pay off: Unreal works everywhere with pointers to objects that the engine manages.'),
          fill('Make the function callable from Blueprints.', '⟦0⟧(⟦1⟧, Category = "Game")\nvoid Explode();', ['UFUNCTION', 'BlueprintCallable'], ['UFUNCTION', 'BlueprintCallable', 'UPROPERTY', 'EditAnywhere']),
          mc('What is a good reason to write logic in C++ rather than only in Blueprints?', ['Performance and clean structure for complex logic', 'Blueprints can\'t have variables', 'C++ needs no compiler', 'Blueprints only run in the editor'], 0),
          concept('Your next step in Unreal',
            'Open Unreal 5 from the Epic Games Launcher, create a **C++ project** (Third Person template) and create your own actor via **Tools, New C++ Class**. Take `ACoin` from this lesson: it spins and shows a message in the output log at startup.\n\nGuide 06 in the Workshop walks you through the setup.'),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 14 */
  {
    id: 'cpp14',
    title: 'Pro tools',
    summary: 'Templates, STL algorithms, lambdas and fast C++ without unnecessary copies.',
    lessons: [
      {
        id: 'cpp14-1',
        title: 'Templates',
        goal: 'Write functions that work with any type.',
        steps: [
          concept('Code for all types',
            'A **template** is a blueprint. Instead of writing `bigger` separately for int, double and float, you write it once with a placeholder type `T`. The compiler creates the matching versions.\n\n`std::vector<int>` itself is a template, just like `TArray<int32>` in Unreal.',
            { code: 'template <typename T>\nT bigger(T a, T b) {\n    return a > b ? a : b;\n}\n\n// bigger(3, 9)      -> 9\n// bigger(2.5, 1.5)  -> 2.5' }),
          mc('What does `a > b ? a : b` mean?', ['If a is bigger, a, otherwise b', 'a times b', 'An error message', 'a divided by b'], 0, 'This is the **ternary operator**, a short form of if/else.'),
          predict('What does this code output?', cppFile('template <typename T>\nT doubled(T x) {\n    return x * 2;\n}', 'std::cout << doubled(4) << " " << doubled(1.5) << std::endl;'), '8 3'),
          write('Write a template `T bigger(T a, T b)`. Output `bigger(3, 9)` and `bigger(2.5, 1.5)`, each on its own line.',
            cppFile('', ''),
            { expect: '9\n2.5', must: [[/template\s*<\s*(typename|class)\s+T\s*>/, 'Start with `template <typename T>`.']], solution: cppFile('template <typename T>\nT bigger(T a, T b) {\n    return a > b ? a : b;\n}', 'std::cout << bigger(3, 9) << std::endl;\nstd::cout << bigger(2.5, 1.5) << std::endl;') }),
        ],
      },
      {
        id: 'cpp14-2',
        title: 'STL algorithms and lambdas',
        goal: 'Sort and search with the standard library.',
        steps: [
          concept('Ready-made algorithms',
            '`#include <algorithm>` brings tested, fast algorithms:\n\n- `std::sort(v.begin(), v.end())`: sort\n- `std::find(v.begin(), v.end(), x)`: search\n- `std::count_if(...)`: count with a condition\n\nA **lambda** is a small function right where you need it: `[](int a, int b) { return a > b; }`. With it you tell `sort`, for example, how to sort.',
            { code: 'std::vector<int> v = {5, 2, 9, 1};\nstd::sort(v.begin(), v.end(), [](int a, int b) {\n    return a > b;    // descending\n});\n// v is now 9 5 2 1' }),
          predict('What does this code output?', 'std::vector<int> hp = {30, 0, 12, 0, 7};\nint dead = std::count_if(hp.begin(), hp.end(), [](int x) { return x == 0; });\nstd::cout << dead << std::endl;', '2'),
          mc('What goes in the square brackets `[]` of a lambda?', ['Which outside variables it may use', 'The return type', 'The parameters', 'The name'], 0),
          write('Sort `std::vector<int> points = {5, 2, 9, 1};` with `std::sort` and a lambda **descending** and output each number on its own line.',
            cppFile('', 'std::vector<int> points = {5, 2, 9, 1};\n', ['iostream', 'vector', 'algorithm']),
            { expect: '9\n5\n2\n1', must: [[/std::sort\s*\(/, 'Use `std::sort`.'], [/\[\s*[&=]?\s*\]\s*\(/, 'Pass `sort` a lambda `[](int a, int b) { ... }`.']], solution: cppFile('', 'std::vector<int> points = {5, 2, 9, 1};\nstd::sort(points.begin(), points.end(), [](int a, int b) {\n    return a > b;\n});\nfor (int p : points) {\n    std::cout << p << std::endl;\n}', ['iostream', 'vector', 'algorithm']) }),
        ],
      },
      {
        id: 'cpp14-3',
        title: 'Fast C++',
        goal: 'Avoid copies and use memory wisely.',
        steps: [
          concept('No unnecessary copies',
            'In games every millisecond counts, at 60 FPS you have 16 per frame. Three pro rules:\n\n- Pass big objects as `const T&`, not as a copy\n- `v.reserve(n)`: reserve space in advance if you know how much is coming\n- `std::move(x)`: hand over ownership instead of copying, e.g. with `unique_ptr`\n\nAlso: data used together is better stored right next to each other in memory. That is why `std::vector` is almost always faster than linked lists.',
            { code: 'int total(const std::vector<int>& values) {   // no copy\n    int t = 0;\n    for (int v : values) t += v;\n    return t;\n}\n\nstd::vector<int> v;\nv.reserve(1000);     // get memory once instead of many times' }),
          mc('Why `const std::vector<int>&` instead of `std::vector<int>` as a parameter?', ['Nothing is copied, and const prevents changes', 'So the vector gets bigger', 'Because & is faster to type', 'There is no difference'], 0),
          mc('What is `std::move` for with a `unique_ptr`?', ['Ownership passes to a new owner, the old one is empty afterwards', 'The memory is copied', 'The object is deleted', 'It moves the window'], 0,
            'A unique_ptr may only have one owner. The compiler forbids copying, moving is allowed.'),
          write('Write `int total(const std::vector<int>& values)` and output the total of `{1, 2, 3, 4, 5}`.',
            cppFile('', '', ['iostream', 'vector']),
            { expect: '15', must: [[/int\s+total\s*\(\s*const\s+std::vector\s*<\s*int\s*>\s*&/, 'The parameter is `const std::vector<int>& values`.']], solution: cppFile('int total(const std::vector<int>& values) {\n    int t = 0;\n    for (int v : values) t += v;\n    return t;\n}', 'std::cout << total({1, 2, 3, 4, 5}) << std::endl;', ['iostream', 'vector']), explain: 'With that you have completed the C++ path: from main() to pro techniques. Keep going in Unreal, the Lab and Training.' }),
        ],
      },
    ],
  },
];
