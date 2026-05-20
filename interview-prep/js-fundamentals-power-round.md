# JavaScript fundamentals — power round

Quick reference for interviews: truthy/falsy, coercion, collections, `this`, closures, async, event loop, DOM patterns. Framing: **plain JS and browser behavior first, then React on top.**

---

## 1. Truthy / falsy

**Falsy (fixed list):**

```js
false
0
-0
0n
''
null
undefined
NaN
```

Everything else is **truthy**, including:

```js
' '
'0'
'false'
[]
{}
[0]
[1]
[{}]
function () {}
```

**Interview line:** “JavaScript has a small fixed list of falsy values. Empty arrays and empty objects are truthy because they are objects. I don’t use `if (arr)` to mean ‘has items’—I check `arr.length > 0`.”

**Rapid predictions:**

```js
Boolean('')           // false
Boolean(' ')          // true
Boolean(0)            // false
Boolean(1)            // true
Boolean([])           // true
Boolean({})           // true
Boolean([0])          // true
Boolean(null)         // false
Boolean(undefined)    // false
Boolean(NaN)          // false
```

---

## 2. `==` vs `===`

- **`===`:** no coercion.
- **`==`:** coercion; interview traps.

```js
0 == false       // true
0 === false      // false

'' == 0          // true
'' === 0         // false

'0' == 0         // true
'0' === 0        // false

[] == false      // true
[] === false     // false

null == undefined    // true
null === undefined     // false
```

**Interview line:** “I default to `===`. If I need conversion, I use `Number()`, `String()`, `Boolean()`, or explicit checks.”

**Useful exception (intentional):**

```js
value == null // true only for null OR undefined
```

---

## 3. `typeof`, `Array.isArray`, edge cases

```js
typeof 'hello'       // 'string'
typeof 123           // 'number'
typeof true          // 'boolean'
typeof undefined     // 'undefined'
typeof function(){}  // 'function'
typeof {}            // 'object'
typeof []            // 'object'
typeof null          // 'object'  // historical quirk
typeof NaN           // 'number'
```

```js
Array.isArray([]) // true
Array.isArray({}) // false

NaN === NaN         // false
Number.isNaN(NaN)   // true
```

**Interview line:** “`typeof null` is a known quirk. For arrays I use `Array.isArray`. For NaN I use `Number.isNaN` because NaN isn’t equal to itself.”

---

## 4. `filter`, `map`, `reduce`, `forEach`

- **`map`:** transform each element → **new array, same length**
- **`filter`:** keep some → **new array**
- **`reduce`:** fold to **one value**
- **`forEach`:** side effects only → **`undefined`**

```js
const doubled = [10, 20, 30].map((n) => n * 2)
const evens = [1, 2, 3, 4].filter((n) => n % 2 === 0)
const total = [10, 20, 30].reduce((sum, n) => sum + n, 0)
const result = [1, 2, 3].forEach((n) => {}) // undefined
```

**`reduce` gotcha:** empty array with no initial value **throws**.

```js
[].reduce((a, b) => a + b)     // throws
[].reduce((a, b) => a + b, 0)  // 0
```

**Interview line:** “I pass an initial accumulator to `reduce`, especially when the array might be empty.”

---

## 5. Mutating vs non-mutating array methods

**Mutates in place:** `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`

**New array / non-mutating:** `map`, `filter`, `reduce`, `slice`, `concat`, `toSorted`, `toReversed`, `toSpliced` (ES2023—check support or polyfill strategy)

```js
const items = [3, 1, 2]
const sorted = [...items].sort((a, b) => a - b)
```

**Interview line:** “In React I avoid mutating arrays in place; copy before `sort`/`reverse` or use non-mutating variants when the runtime allows.”

---

## 6. Object spread and merge collisions

**Rightmost wins** with object spread:

```js
const merged = { ...defaults, ...user }
```

**Shallow only** — nested objects still shared:

```js
const b = { ...a }
b.settings.theme = 'light' // mutates nested object visible from `a` if shared
```

`Object.assign` **mutates** the first argument; clone target first: `Object.assign({}, a, b)`.

**Interview line:** “Spread is shallow and last key wins. Nested objects need an intentional merge or a real deep-merge / clone strategy.”

---

## 7. Destructuring and defaults

```js
const { name, role } = user
const { name: displayName } = user
const { theme = 'light' } = user // default only if `undefined`, not `null`
```

```js
function greet({ name = 'there' } = {}) {
  return `Hi ${name}`
}
```

The `= {}` avoids crashes when the argument is missing.

---

## 8. Optional chaining and nullish coalescing

```js
user?.profile?.email
const count = value ?? 0
```

**`??` vs `||`:** `??` only falls back for **`null` / `undefined`**.

```js
0 || 10   // 10
0 ?? 10   // 0

'' || 'fallback'  // 'fallback'
'' ?? 'fallback'  // ''
```

**Interview line:** “I use `??` when `0`, `false`, or `''` are valid. I use `||` when any falsy should fall back.”

---

## 9. Closures

Inner function retains outer variables after the outer function returns.

**Classic loop trap:** `var` + `setTimeout` → prints final `i`; **`let`** per iteration fixes it.

---

## 10. `this` binding

- **Regular function:** `this` from **call site** (`obj.method()` vs extracted `const fn = obj.method; fn()`).
- **Arrow function:** no own `this` — lexically closed over outer `this` (great for callbacks, usually wrong for object methods).

---

## 11. Promises and async/await

States: **pending → fulfilled / rejected**.

`fetch` **only rejects on network failure**, not 4xx/5xx — always check:

```js
if (!response.ok) throw new Error(`HTTP ${response.status}`)
```

**Async errors:** `try/catch` around **`await`**, or `.catch()` on the promise. Un-awaited promises won’t be caught by a surrounding `try/catch`.

---

## 12. `Promise.all`, `Promise.allSettled`, `Promise.race`

- **`all`:** all required; **fails fast** on first rejection.
- **`allSettled`:** wait for all; partial failure OK.
- **`race`:** first settled wins — timeouts / first response.

---

## 13. Event loop: microtasks vs macrotasks

```js
console.log('A')
setTimeout(() => console.log('B'), 0)
Promise.resolve().then(() => console.log('C'))
console.log('D')
// A, D, C, B
```

Sync stack first → **microtasks** (e.g. promise `.then`) → **macrotasks** (e.g. `setTimeout`).

`async`/`await` pauses the async function; code after `await` runs as a microtask relative to surrounding sync work (practice the `C A D B` style traces).

**Interview line:** “Current call stack runs to completion, then microtasks, then the next macrotask.”

---

## 14. Pass by value vs reference

Primitives copy value; objects copy **reference**. Spread `{ ...obj }` is a **shallow** copy.

---

## 15. Equality: objects / arrays

`{} === {}` and `[] === []` are **false** (different references). Same reference → `true`.

---

## 16. `slice` vs `splice`

- **`slice`:** non-mutating copy/extract.
- **`splice`:** mutates in place.

Mnemonic: **slice = copy**, **splice = surgery**.

---

## 17. `find` vs `filter`

- **`find`:** first match or **`undefined`**.
- **`filter`:** all matches, always an array.

---

## 18. `some` vs `every`

```js
[].some(Boolean)   // false
[].every(Boolean)  // true  // vacuous truth
```

---

## 19. `Set` and `Map`

- **`Set`:** uniqueness / membership.
- **`Map`:** arbitrary keys; object keys are coerced (e.g. numeric keys → strings in plain objects).

---

## 20. Hoisting: `var`, `let`, `const`, function declarations

- **Function declarations:** hoisted, callable before line in scope.
- **`var`:** hoisted as **`undefined`**; function-scoped.
- **`let` / `const`:** hoisted but **TDZ** until declaration runs → `ReferenceError` if accessed early.

**Extra:** `const fn = () => {}` is **not** hoisted like `function fn() {}` — the binding is in TDZ until that line executes.

---

## 21. Scope: block vs function

`var` leaks out of blocks; `let`/`const` are block-scoped. Prefer **`const`**, then **`let`**, avoid **`var`**.

---

## 22. Debounce vs throttle

- **Debounce:** run after activity **stops** (search input).
- **Throttle:** run at most **once per window** while events keep firing (scroll/resize).

---

## 23. Event delegation

One listener on a parent; use `event.target.closest(...)` to match dynamic children. Good for large or dynamic lists.

---

## 24. Lightning round (drill cold)

```js
Boolean([])
Boolean({})
Boolean(' ')
[] == false
[] === false
typeof null
Array.isArray([])
NaN === NaN
Number.isNaN(NaN)
'5' + 1
'5' - 1
[1, 2, 3].forEach((x) => x * 2) // undefined
[1, 2, 3].map((x) => x * 2)
[1, 2, 3].filter((x) => x > 1)
[1, 2, 3].reduce((a, b) => a + b, 0)
{} === {}
[] === []
```

---

## 25. Extras (30-minute add-ons)

- **`flat` / `flatMap`:** reshaping nested API arrays without deep manual loops.
- **`structuredClone`:** deep clone for plain data in modern runtimes; no functions; watch unsupported types vs `JSON` round-trip hacks.
- **`toSorted` / `toReversed` / `toSpliced`:** great when supported; otherwise **copy then mutate** for broad browser support.

---

## Interview framing (one sentence)

“I start from values, references, array semantics, async and the event loop, and network/DOM behavior—then I layer framework patterns on top.”
