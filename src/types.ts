export type Config = {
  type: string;
} & {
  anchor_id: string;
  offset?: number;
  negative_margin?: number;
  timeout?: number;
}
