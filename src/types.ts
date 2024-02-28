/* eslint-disable linebreak-style */
export type Config = {
  type: string;
} & {
  anchor_id: string;
  offset?: number;
  negative_margin?: number;
  timeout?: number;
  disable_in_edit_mode?: boolean;
  backout?: boolean;
}
