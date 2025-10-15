// minimal shapes that match your FilterMeta from backend
export type FieldType = 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'enum';

export type FieldMeta = {
  name: string;           // backend field: e.g. "name"
  label?: string;         // display label
  type: FieldType;        // input type
  sortable?: boolean;
  filterable?: boolean;
  enumValues?: Array<{ value: string; label?: string }>; // optional for enums
};

export type FilterMeta = {
  fields: FieldMeta[];
  defaultPageSize?: number;
  sortable?: string[];    // optional
};
