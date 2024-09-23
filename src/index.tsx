/* eslint-disable linebreak-style */
/* eslint-disable brace-style */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable no-underscore-dangle */
// import { HomeAssistant } from 'custom-card-helpers';
import { render } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
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

function smoothScrollTo(targetPosition: number, duration: number) {
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  function ease(t: number, b: number, c: number, d: number) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}

class AnchorCard extends HTMLElement {
  constructor() {
    super();
    this.scrollToAnchor = this.scrollToAnchor.bind(this);
  }

  private config: Config;

  private lastUrl: string | null = null;

  private backoutResponsibility: boolean = false;

  private anchorReplacementElement: Element | null = null;

  checkLocationChange = debounce(() => {
    const newUrl = window.location.href;

    if (
      this.config.disable_in_edit_mode !== false
      && window.location.search.includes('edit=1')
    ) return;

    if (newUrl === this.lastUrl) {
      if (this.backoutResponsibility) {
        window.history.back();
      }
      return;
    }

    window.dispatchEvent(new Event('locationchange'));
    this.lastUrl = newUrl;
  }, 100);

  scrollToAnchor() {
    requestAnimationFrame(() => {
      const anchorId = this.config.anchor_id;

      const urlParams = new URLSearchParams(window.location.search);
      const anchorParam = urlParams.get('anchor');

      if (anchorParam && anchorParam === anchorId) {
        if (this.config.backout === true) this.backoutResponsibility = true;
        setTimeout(() => {
          // Get current position
          const rect = this.anchorReplacementElement ?
            this.anchorReplacementElement.getBoundingClientRect() :
            this.getBoundingClientRect();
          const offset = this.config.offset || 0;
          const scrollTop = window.scrollY || document.documentElement.scrollTop;

          if (this.config.transition) {
            smoothScrollTo(
              rect.top + scrollTop + offset,
              this.config.transition,
            );
          } else {
            window.scrollTo({
              top: rect.top + scrollTop + offset,
              behavior: 'smooth',
            });
          }
        }, this.config.timeout || 150);

        // Remove anchor param from url
        urlParams.delete('anchor');
        const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}${
          urlParams.size ? '?' : ''
        }${urlParams}`;

        window.history.replaceState({}, '', newUrl);
      } else if (anchorParam) {
        this.backoutResponsibility = false;
      }
    });
  }

  connectedCallback() {
    this.backoutResponsibility = false;
    this.lastUrl = window.location.href;

    // fix scaling
    setTimeout(() => {
      const parent = this.parentElement;
      if (parent) {
        parent.style.height = '0px';
        parent.style.maxHeight = '0px';
      }
    }, 10);

    // fix scaling in section view
    setTimeout(() => {
      const parent = this.parentElement.parentElement;
      if (parent && parent.classList.contains('card')) {
        parent.style.visibility = 'hidden';
        parent.style.position = 'absolute';
        this.anchorReplacementElement = parent.nextElementSibling;
      }
    }, 10);

    (() => {
      const oldPushState = window.history.pushState;
      window.history.pushState = function pushState(...args) {
        const ret = oldPushState.apply(this, args);
        window.dispatchEvent(new Event('pushstate'));
        return ret;
      };

      const oldReplaceState = window.history.replaceState;
      window.history.replaceState = function replaceState(...args) {
        const ret = oldReplaceState.apply(this, args);
        window.dispatchEvent(new Event('replacestate'));
        return ret;
      };

      window.addEventListener('popstate', this.checkLocationChange);
      window.addEventListener('pushstate', this.checkLocationChange);
      window.addEventListener('replacestate', this.checkLocationChange);
    })();

    window.addEventListener('locationchange', this.scrollToAnchor);

    window.dispatchEvent(new Event('locationchange'));
  }

  disconnectedCallback() {
    window.removeEventListener('locationchange', this.scrollToAnchor);

    window.removeEventListener('popstate', this.checkLocationChange);
    window.removeEventListener('pushstate', this.checkLocationChange);
    window.removeEventListener('replacestate', this.checkLocationChange);
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
            borderWidth: '0px',
            maxHeight: '0px',
            height: '0px',
            transform: 'scale(0)',
          } as JSXInternal.CSSProperties}
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

const name = process.env.NODE_ENV === 'development' ? 'anchor-card-dev' : 'anchor-card';
const title = process.env.NODE_ENV === 'development' ? 'Anchor Card (Dev)' : 'Anchor Card';

customElements.define(name, AnchorCard);

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    customCards?: any[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: name,
  name: title,
  preview: false,
  description: 'A card that acts as a scroll anchor',
});
