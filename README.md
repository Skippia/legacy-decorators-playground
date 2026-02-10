# Legacy Decorator Playground

Учебный playground для изучения **legacy (experimental) декораторов** TypeScript и библиотеки `reflect-metadata`. Демонстрирует создание method/class декораторов, перехват вызовов методов и интроспекцию метаданных через Reflect Metadata API.

> **Legacy decorators** — это экспериментальная реализация декораторов в TypeScript (`experimentalDecorators`), которая отличается от нового стандарта [TC39 Stage 3 Decorators](https://github.com/tc39/proposal-decorators). Legacy-версия до сих пор широко используется в Angular, NestJS, TypeORM и других фреймворках.

## Требования

- Node.js >= 18
- npm

## Зависимости

| Пакет | Тип | Назначение |
|---|---|---|
| `reflect-metadata` | runtime | Полифил Metadata Reflection API для хранения/чтения метаданных |
| `tslib` | runtime | Вспомогательные функции TypeScript (хелперы для `__decorate`, `__metadata` и др.) |
| `tsx` | dev | Рантайм для запуска `.ts` файлов напрямую (без предварительной компиляции), используется в `npm start` / `npm run dev` |
| `@types/node` | dev | Типы для Node.js API |

## Установка и запуск

```bash
npm install

# Однократный запуск
npm start

# Запуск в watch-режиме (перезапуск при изменении файлов)
npm run dev
```

## Структура проекта

```
legacy-decorator-playground/
├── src/
│   ├── decorators.ts          # Определения декораторов (info, LuckyNumber)
│   ├── main.ts                # Точка входа: класс Settings, применение декораторов
│   └── show-all-metadata.ts   # Утилита для интроспекции метаданных через Reflect
├── tsconfig.json              # Конфигурация TypeScript (experimentalDecorators, emitDecoratorMetadata)
├── package.json
└── .gitignore
```

## Ключевые концепции

### Legacy Decorators vs TC39 Stage 3

| | Legacy (`experimentalDecorators`) | TC39 Stage 3 |
|---|---|---|
| Статус | Экспериментальные, стабильно работают | Стандарт (с TS 5.0) |
| Включение | Флаг `experimentalDecorators` в tsconfig | Работают по умолчанию (TS 5.0+) |
| Emit metadata | Поддерживается (`emitDecoratorMetadata`) | Не поддерживается |
| Использование | Angular, NestJS, TypeORM | Новые проекты |
| Сигнатуры | `(target, key, descriptor)` | `(value, context)` |

### Флаги tsconfig.json

- **`experimentalDecorators: true`** — включает поддержку legacy-декораторов
- **`emitDecoratorMetadata: true`** — TypeScript автоматически генерирует метаданные типов (`design:type`, `design:paramtypes`, `design:returntype`) для декорированных элементов. Именно это позволяет `reflect-metadata` работать с типами

## Разбор кода

### `src/decorators.ts` — определения декораторов

#### `info` — method decorator

```ts
function info(target: Object, propertyKey: string, descriptor: PropertyDescriptor)
```

Классический **method decorator**. Принимает три аргумента:

- `target` — прототип класса (`Settings.prototype`)
- `propertyKey` — имя метода (`"mount"`)
- `descriptor` — дескриптор свойства (содержит оригинальный метод в `descriptor.value`)

Декоратор оборачивает оригинальный метод: логирует контекст вызова (`this`, `target`, `propertyKey`, `args`), затем вызывает оригинальный метод через `originalMethod.apply(this, args)` и перехватывает выполнение до и после вызова.

> **`this: void`** — аннотация в сигнатуре (`function info(this: void, ...)`) запрещает обращение к `this` внутри самой функции-декоратора (не путать с `this` внутри обёртки). Это TypeScript-приём для защиты от случайного использования некорректного контекста.

#### `LuckyNumber` — class decorator factory

```ts
function LuckyNumber() {
  return function (constructor: Function) { ... }
}
```

**Фабрика class-декоратора** — функция, которая возвращает сам декоратор. Вызывается с `@LuckyNumber()` (со скобками).

Class decorator получает единственный аргумент — **конструктор класса**. Внутри декоратор модифицирует `constructor.prototype.mount`, оборачивая его в функцию-перехватчик. Это позволяет добавить логику до и после вызова `mount` на уровне класса.

### `src/main.ts` — точка входа

#### Side-effect import `reflect-metadata`

```ts
import "reflect-metadata";
```

Этот импорт **обязателен** и должен выполняться **один раз в точке входа** приложения. Он регистрирует глобальный полифил `Reflect.metadata`, `Reflect.getMetadata` и другие методы. Без него все вызовы Reflect Metadata API будут падать с ошибкой.

#### Класс `Secret` (базовый)

```ts
class Secret {
  secret = 'secret_key'
}
```

Простой класс-родитель, демонстрирующий наследование. Экземпляр `Settings` получает свойство `secret` через `super()`.

#### Класс `Settings`

Наследуется от `Secret` и демонстрирует:

```ts
@LuckyNumber()                        // class decorator factory
@Reflect.metadata('some-key', 42)     // class-level metadata
export class Settings extends Secret {
  @info                               // method decorator
  @Reflect.metadata('some-prop', 111) // method-level metadata
  mount(num: number) { ... }

  unmount() { }  // не декорирован — не получает design:* метаданных
}
```

Метод `unmount()` намеренно оставлен без декораторов. Это демонстрирует, что TypeScript генерирует `design:*` метаданные **только для декорированных** элементов — у `unmount` ключи `design:type`, `design:paramtypes`, `design:returntype` отсутствуют.

**Важные наблюдения из кода:**

1. **Декораторы выполняются до создания экземпляра класса** — это происходит на этапе определения класса
2. **Class decorator** имеет доступ только к конструктору (`Settings`)
3. **Property/method decorator** имеет доступ к прототипу класса (`Settings.prototype`)
4. Код демонстрирует, что `Settings.prototype === settings.constructor.prototype === Object.getPrototypeOf(settings)` — три способа получить один и тот же объект-прототип

### `src/show-all-metadata.ts` — интроспекция метаданных

Утилитарная функция `showAllMetadata(constructor, prefix)` демонстрирует различные способы чтения метаданных через Reflect API.

## Порядок выполнения декораторов

### Method decorators — снизу вверх

```ts
@info                               // 2-й: выполняется вторым
@Reflect.metadata('some-prop', 111) // 1-й: выполняется первым
mount(num: number) { ... }
```

Декораторы метода применяются **снизу вверх** (от ближайшего к методу — к дальнему). Сначала `@Reflect.metadata` устанавливает метаданные, затем `@info` оборачивает метод.

### Class decorators — снизу вверх

```ts
@LuckyNumber()                    // 2-й: выполняется вторым
@Reflect.metadata('some-key', 42) // 1-й: выполняется первым
class Settings { ... }
```

Аналогично: сначала `@Reflect.metadata` добавляет метаданные на класс, затем `@LuckyNumber()` модифицирует прототип.

### Общий порядок

1. Сначала выполняются все **method decorators** (для каждого метода снизу вверх)
2. Затем выполняются все **class decorators** (снизу вверх)

Это означает, что class decorator всегда видит уже декорированные методы.

### Двойное оборачивание и цепочка вызовов

В данном проекте метод `mount` оборачивается **дважды**: сначала method-декоратором `@info`, затем class-декоратором `@LuckyNumber()` (который читает уже обёрнутый `constructor.prototype.mount`).

При вызове `settings.mount(1)` выполняется следующая цепочка:

```
settings.mount(1)
│
├─ LuckyNumber wrapper        ← class decorator обернул последним, вызывается первым
│  ├─ console.log("intercepted mount before", 1)
│  │
│  ├─ вызов originalMethod (= info wrapper)
│  │  │
│  │  ├─ info wrapper          ← method decorator обернул первым
│  │  │  ├─ console.dir({ this, target, propertyKey, args })
│  │  │  ├─ console.log("intercepted mount before", 1)
│  │  │  │
│  │  │  ├─ вызов originalMethod (= настоящий mount)
│  │  │  │  └─ console.log("original mount", 1)
│  │  │  │
│  │  │  └─ console.log("intercepted mount after", 1)
│  │  │
│  └─ console.log("intercepted mount after", 1)
```

Это классический паттерн **матрёшки**: декоратор, применённый последним (внешний), перехватывает вызов первым.

## Reflect Metadata API

Библиотека `reflect-metadata` добавляет полифил для Metadata Reflection API. Метаданные привязываются к объектам (классам, прототипам) и опционально к ключам свойств.

### Чтение метаданных класса

```ts
// Метаданные, привязанные к конструктору (class-level)
Reflect.getMetadata('some-key', constructor)        // 42
Reflect.getOwnMetadata('some-key', constructor)     // 42
```

- `getMetadata` — ищет по цепочке прототипов
- `getOwnMetadata` — только собственные метаданные (без наследования)

### Чтение метаданных свойства

```ts
// Метаданные, привязанные к prototype + имя свойства (method-level)
Reflect.getMetadata('some-prop', constructor.prototype, 'mount')  // 111
```

**Важно:** метаданные свойств хранятся на **прототипе** (`constructor.prototype`), а не на конструкторе.

### Получение всех ключей метаданных

```ts
// Ключи метаданных класса
Reflect.getMetadataKeys(constructor)
// => ['design:paramtypes', 'some-key']

// Ключи метаданных свойства
Reflect.getMetadataKeys(constructor.prototype, 'mount')
// => ['design:type', 'design:paramtypes', 'design:returntype', 'some-prop']
```

Ключи `design:*` генерируются автоматически TypeScript при включённом `emitDecoratorMetadata`:

| Ключ | Описание | Пример значения |
|---|---|---|
| `design:type` | Тип свойства/метода | `Function` |
| `design:paramtypes` | Типы параметров | `[Number]` для `mount(num: number)` |
| `design:returntype` | Тип возвращаемого значения | `undefined` (void) |

### target vs prototype — куда привязываются метаданные

| Уровень | Где хранятся | Как читать |
|---|---|---|
| Class (`@Reflect.metadata` на классе) | На конструкторе | `Reflect.getMetadata(key, Constructor)` |
| Method (`@Reflect.metadata` на методе) | На прототипе + ключ | `Reflect.getMetadata(key, Constructor.prototype, 'methodName')` |

## Конфигурация TypeScript

Ключевые опции `tsconfig.json` для работы с legacy-декораторами:

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,   // Включает legacy-декораторы
    "emitDecoratorMetadata": true,    // Генерирует design:* метаданные
    "target": "ES6",                  // Целевая версия JS
    "module": "Node16",               // Модульная система
    "moduleResolution": "node16",     // Стратегия резолва модулей
    "strict": true,                   // Строгая проверка типов
    "verbatimModuleSyntax": true,     // Явный import type для type-only импортов
    "types": ["node", "reflect-metadata"]  // Подключение типов reflect-metadata
  }
}
```

## Полезные ссылки

- [TypeScript Handbook: Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) — официальная документация по legacy-декораторам
- [reflect-metadata (npm)](https://www.npmjs.com/package/reflect-metadata) — библиотека Metadata Reflection API
- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators) — новый стандарт декораторов (Stage 3)
- [TypeScript 5.0: New Decorators](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators) — поддержка TC39-декораторов в TS 5.0
