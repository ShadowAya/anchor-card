export type Config = {
  type: string;
} & {
  anchor_id: string;
  offset?: number;
  negative_margin?: number;
  timeout?: number;
  strict_url_change?: boolean;
  disable_in_edit_mode?: boolean;
}
