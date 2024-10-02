import 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ha-card': JSX.HTMLAttributes<HTMLElement>;
      'ha-form': Omit<
        JSX.HTMLAttributes<HTMLElement>,
        'data'
      > & {
        hass?: any, schema?: any, data?: any, computeLabel?: any,
        addEventListener?: any, removeEventListener?: any
      };
    }
  }
}
