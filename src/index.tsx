/* eslint-disable brace-style */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable no-underscore-dangle */
// import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { Config } from 'types';

class AnchorCard extends HTMLElement {
  private config: Config;

  private _observer: IntersectionObserver | null = null;

  getCardColumn(): HTMLElement | null {
    let element: HTMLElement | null = this;

    while (element) {
      if (element instanceof ShadowRoot) {
        element = element.host as HTMLElement;
      }
      if (element.classList?.contains('column')) {
        return element;
      }
      element = element.parentElement || element.getRootNode() as HTMLElement;
    }

    return null;
  }

  scrollToAnchor() {
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
      }
    }, this.config.timeout || 150);
  }

  connectedCallback() {
    const columnElement = this.getCardColumn();
    if (!this._observer && columnElement) {
      this._observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.scrollToAnchor();
          }
        });
      });

      this._observer.observe(columnElement);
    }
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
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
