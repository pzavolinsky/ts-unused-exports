Feature: Skip unused interface or type

Background:
  Given file "a.ts" is
    """
    export function unused_fun(a, b) { return a + b; };
    export const a_unused_const = 1;
    export interface IUnused {}
    export class ClassUnused {}
    export type TUnused {}

    export namespace ns {
    export function inner_unused_fun(a, b) { return a + b; };
    export const inner_a_unused_const = 1;
    export interface inner_IUnused {}
    export class inner_ClassUnused {}
    export type inner_TUnused {}
    }
    """

Scenario: Not skipping
  When analyzing "tsconfig.json"
  Then the result at a.ts is ["unused_fun", "a_unused_const", "IUnused", "ClassUnused", "TUnused", "ns"]

Scenario: Not skipping, with namespace
  When analyzing "tsconfig.json" with files ["--searchNamespaces"]
  Then the result at a.ts is ["unused_fun", "a_unused_const", "IUnused", "ClassUnused", "TUnused", "ns", "ns.inner_unused_fun", "ns.inner_a_unused_const", "ns.inner_IUnused", "ns.inner_ClassUnused", "ns.inner_TUnused"]

Scenario: Skipping type or interface
  When analyzing "tsconfig.json" with files ["--allowUnusedTypes"]
  Then the result at a.ts is ["unused_fun", "a_unused_const", "ClassUnused", "ns"]

Scenario: Skipping type or interface, with namespaces
  When analyzing "tsconfig.json" with files ["--allowUnusedTypes", "--searchNamespaces"]
  Then the result at a.ts is ["unused_fun", "a_unused_const", "ClassUnused", "ns", "ns.inner_unused_fun", "ns.inner_a_unused_const", "ns.inner_ClassUnused"]
