export type SpecFieldType = "text" | "number" | "select" | "boolean" | "tristate";

export interface SpecOption {
  value: string;
  label: string;
}

export interface SpecField {
  key: string;
  label: string;
  labelEn: string;
  type: SpecFieldType;
  options?: readonly SpecOption[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  /** Indexed into listing_attributes and exposed as a browse filter. */
  filterable?: boolean;
  /** Shown in the one-line spec summary on listing cards (in order). */
  highlight?: boolean;
  /** Model names, part numbers — rendered with dir="ltr". */
  ltr?: boolean;
  min?: number;
  max?: number;
  group: "core" | "condition" | "extras";
}

export interface SpecSchema {
  key: string;
  fields: readonly SpecField[];
}

export type SpecValues = Record<string, string | number | boolean | null | undefined>;
