// https://stackoverflow.com/a/60843132/8107589
export function typeAssert<T extends Pass>() {}

type Pass = "pass";
type Test<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? Pass
    : { actual: T; expected: U }
  : { actual: T; expected: U };

typeAssert<Test<number, { k: number }["k"]>>();

export type KeysOfType<T extends object, V> = {
  [K in keyof T]-?: NonNullable<T[K]> extends V ? K : never;
}[keyof T];

interface Foo {
  a: boolean;
  b: boolean;
  c: number;
}

typeAssert<Test<KeysOfType<Foo, boolean>, "a" | "b">>();
typeAssert<Test<KeysOfType<Foo, number>, "c">>();
typeAssert<Test<KeysOfType<Foo, string>, never>>();

// https://dev.to/lucianbc/union-type-merging-in-typescript-9al
export type Merge<T extends object> = {
  [k in CommonKeys<T>]: PickTypeOf<T, k>;
} & {
  [k in NonCommonKeys<T>]?: PickTypeOf<T, k>;
};

type CommonKeys<T extends object> = keyof T;
type AllKeys<T> = T extends any ? keyof T : never;
type Subtract<A, C> = A extends C ? never : A;
type NonCommonKeys<T extends object> = Subtract<AllKeys<T>, CommonKeys<T>>;
type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: any }
  ? T[K]
  : undefined;
type PickTypeOf<T, K extends string | number | symbol> = K extends AllKeys<T>
  ? PickType<T, K>
  : never;

interface A {
  allMatching: string;
  allDiffer: string;

  someMatching: string;
  someDiffer: string;
}
interface B {
  allMatching: string;
  allDiffer: number;

  someMatching: string;
  someDiffer: number;
}
interface C {
  allMatching: string;
  allDiffer: boolean;
}
type M = Merge<A | B | C>;

typeAssert<Test<M["allMatching"], string>>();
typeAssert<Test<M["allDiffer"], string | number | boolean>>();

typeAssert<Test<M["someMatching"], string | undefined>>();
typeAssert<Test<M["someDiffer"], string | number | undefined>>();
