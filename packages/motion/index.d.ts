/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const fast01: string;
export const fast02: string;
export const moderate01: string;
export const moderate02: string;
export const slow01: string;
export const slow02: string;

export const durationFast01: string;
export const durationFast02: string;
export const durationModerate01: string;
export const durationModerate02: string;
export const durationSlow01: string;
export const durationSlow02: string;

export const unstable_tokens: readonly [
  'fast01',
  'fast02',
  'moderate01',
  'moderate02',
  'slow01',
  'slow02',
  'durationFast01',
  'durationFast02',
  'durationModerate01',
  'durationModerate02',
  'durationSlow01',
  'durationSlow02',
];

export type UnstableToken = (typeof unstable_tokens)[number];

export type EasingName = 'standard' | 'entrance' | 'exit';
export type EasingMode = 'productive' | 'expressive';

export type EasingMap = Record<EasingName, Record<EasingMode, string>>;

export const easings: EasingMap;

export const motion: (name: EasingName, mode: EasingMode) => string;
