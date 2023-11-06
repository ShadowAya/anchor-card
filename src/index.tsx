/* eslint-disable brace-style */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable no-underscore-dangle */
// import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { Config } from 'types';

function debounce(func: Function, delay = 100) {
  // eslint-disable-next-line no-undef
  let timeoutId: NodeJS.Timeout;
  return (...args: any) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

class AnchorCard extends HTMLElement {
  constructor() {
    super();
    this.scrollToAnchor = this.scrollToAnchor.bind(this);
  }

  private config: Config;

  private lastUrl: string | null = null;

  handlePopState: () => void;

  scrollToAnchor() {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const anchorId = this.config.anchor_id;

        const urlParams = new URLSearchParams(window.location.search);
        const anchorParam = urlParams.get('anchor');

        if (anchorParam && anchorParam === anchorId) {
          // Get current position
          const rect = this.getBoundingClientRect();
          const offset = this.config.offset || 0;
          const scrollTop = window.scrollY || document.documentElement.scrollTop;

          // Smooth scroll to the calculated position
          window.scrollTo({
            top: rect.top + scrollTop + offset,
            behavior: 'smooth',
          });

          if (this.config.remove_anchor !== false) {
            // Remove anchor param from url
            urlParams.delete('anchor');
            const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${urlParams}`;

            window.history.replaceState({}, '', newUrl);
          }
        }
      }, this.config.timeout || 150);
    });
  }

  connectedCallback() {
    (() => {
      const checkLocationChange = debounce(() => {
        const newUrl = window.location.href;

        if (
          this.config.disable_in_edit_mode !== false
          && window.location.search.includes('edit=1')
        ) return;

        if (this.config.strict_url_change && (newUrl === this.lastUrl)) return;

        window.dispatchEvent(new Event('locationchange'));
        this.lastUrl = newUrl;
      }, 100);

      const oldPushState = window.history.pushState;
      window.history.pushState = function pushState(...args) {
        const ret = oldPushState.apply(this, args);
        window.dispatchEvent(new Event('pushstate'));
        checkLocationChange();
        return ret;
      };

      const oldReplaceState = window.history.replaceState;
      window.history.replaceState = function replaceState(...args) {
        const ret = oldReplaceState.apply(this, args);
        window.dispatchEvent(new Event('replacestate'));
        checkLocationChange();
        return ret;
      };

      this.handlePopState = () => {
        checkLocationChange();
      };

      window.addEventListener('popstate', this.handlePopState);
    })();

    window.addEventListener('locationchange', this.scrollToAnchor);

    window.dispatchEvent(new Event('locationchange'));
  }

  disconnectedCallback() {
    window.removeEventListener('locationchange', this.scrollToAnchor);

    window.removeEventListener('popstate', this.handlePopState);
  }

  setConfig(config: any) {
    this.config = config;
    this._render();
  }

  private _render = () => {
    render(
      (
        <>
          { /* @ts-ignore */ }
          <ha-card style={{
            margin: `-${this.config.negative_margin || 13}px 0`,
          }}
          >
            {!this.config.anchor_id && (
              <ul style={{ padding: '20px' }}>
                <li>
                  anchor_id - set a per-page unique identifier.
                  scroll to this card using the url param
                  {' '}
                  <strong>anchor</strong>
                  <br />
                  <i>example: lovelace/0?anchor=lights</i>
                </li>
                <li>
                  negative_margin - set a negative margin of the card to fix spacing visuals.
                  default is 13px.
                </li>
                <li>
                  timeout - set a timeout to wait before scrolling to the card. default is 150ms.
                  increase this if other cards take long to render.
                </li>
                <li>
                  offset - the scroll offset. default is 0. can be a negative value.
                </li>
                <li>
                  strict_url_change - set to true to only scroll when the url changes.
                </li>
                <li>
                  disable_in_edit_mode - prevent scrolling when edit=1.
                </li>
                <li>
                  remove_anchor - removes the anchor param from the url after scrolling.
                  default is true.
                </li>
              </ul>
            )}
            { /* @ts-ignore */ }
          </ha-card>
        </>
      ), this,
    );
  };

  getCardSize() {
    return 1;
  }
}

customElements.define('anchor-card', AnchorCard);

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    customCards?: any[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'anchor-card',
  name: 'Anchor Card',
  preview: false,
  description: 'A card that acts as a scroll anchor',
});
