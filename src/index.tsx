/* eslint-disable linebreak-style */
/* eslint-disable brace-style */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable no-underscore-dangle */
// import { HomeAssistant } from 'custom-card-helpers';
import { createRef, render } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { Config } from 'types';
import { HomeAssistant } from 'custom-card-helpers';
import FormComponent from 'FormComponent';
import { ConfigProvider, HassContext, HassProvider } from 'context';

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

const parentCardName = process.env.NODE_ENV === 'development' ? 'anchor-card-dev' : 'anchor-card';
const parentCardTitle = process.env.NODE_ENV === 'development' ? 'Anchor Card (Dev)' : 'Anchor Card';

const configCardName = process.env.NODE_ENV === 'development' ? 'anchor-card-editor-dev' : 'anchor-card-editor';

class AnchorCard extends HTMLElement {
  constructor() {
    super();
    this.scrollToAnchor = this.scrollToAnchor.bind(this);
  }

  static getConfigElement() {
    return document.createElement(configCardName);
  }

  static getStubConfig() {
    return {
      anchor_id: 'example',
      negative_margin: 13,
      timeout: 50,
      offset: 0,
      transition: 0,
    }
  }

  private config: Config;

  private anchorReplacementElement: Element | null = null;
  private replacementIsOnTop = false;

  checkLocationChange = debounce(() => {
    if (
      window.location.search.includes('edit=1')
    ) return;

    window.dispatchEvent(new Event('locationchange'));
  }, 100);

  scrollToAnchor() {
    requestAnimationFrame(() => {
      const anchorId = this.config.anchor_id;

      const urlParams = new URLSearchParams(window.location.search);
      const anchorParam = urlParams.get('anchor');

      if (anchorParam === anchorId) {
        setTimeout(() => {
          // Get current position
          const rect = this.anchorReplacementElement ?
            this.anchorReplacementElement.getBoundingClientRect() :
            this.getBoundingClientRect();
          const offset = this.config.offset || 0;
          const scrollTop = window.scrollY || document.documentElement.scrollTop;

          if (this.config.transition) {
            smoothScrollTo(
              rect.top + scrollTop + offset + (this.replacementIsOnTop ? rect.height : 0),
              this.config.transition,
            );
          } else {
            window.scrollTo({
              top: rect.top + scrollTop + offset + (this.replacementIsOnTop ? rect.height : 0),
              behavior: 'smooth',
            });
          }
        }, this.config.timeout || 50);

        // Remove anchor param from url
        urlParams.delete('anchor');
        const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}${
          urlParams.size ? '?' : ''
        }${urlParams}`;

        window.history.replaceState({}, '', newUrl);
      }
    });
  }

  connectedCallback() {

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
        if (parent.nextElementSibling)
          this.anchorReplacementElement = parent.nextElementSibling;
        else if (parent.previousElementSibling) {
          this.anchorReplacementElement = parent.previousElementSibling;
          this.replacementIsOnTop = true;
        }
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
          <ha-card style={{
            margin: `-${this.config.negative_margin || 13}px 0`,
            borderWidth: '0px',
            maxHeight: '0px',
            height: '0px',
            transform: 'scale(0)',
          } as JSXInternal.CSSProperties}
          />
        </>
      ), this,
    );
  };

  getCardSize() {
    return 1;
  }
}

class AnchorCardEditor extends HTMLElement {

  private _config: Config;

  private _hass?: HomeAssistant;

  private usedBackoutBefore = false;

  set hass(hass: HomeAssistant | undefined) {
    this._hass = hass;
  }

  setConfig(config: Config) {
    if (
      config.anchor_id === undefined ||
      config.negative_margin === undefined ||
      config.timeout === undefined ||
      config.offset === undefined ||
      config.transition === undefined ||
      // @ts-ignore
      config.backout !== undefined
    ) {
      // @ts-ignore
      if (config.backout !== undefined) this.usedBackoutBefore = true;
      config = {
        anchor_id: 'example',
        negative_margin: 13,
        timeout: 50,
        offset: 0,
        transition: 0,
        ...config,
        // @ts-ignore
        backout: undefined,
      }
      const event = new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
    this._config = config;
    this._render();
  }

  private configChanged(ev: any) {

    // if (!this._config || !this._hass) {
    //   return;
    // }
    const config = Object.assign({}, this._config);
    config.anchor_id = ev.detail.value.anchor_id;
    config.negative_margin = ev.detail.value.negative_margin;
    config.timeout = ev.detail.value.timeout;
    config.offset = ev.detail.value.offset;
    config.transition = ev.detail.value.transition;

    this._config = config;

    const event = new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);

    this._render();
  }

  computeLabel(schema: { name: string }) {
    var labelMap = {
        anchor_id: "Anchor ID",
        negative_margin: "Negative Margin",
        timeout: "Timeout (wait time before scrolling)",
        offset: "Offset (scroll offset)",
        transition: "Transition (scroll duration, set to 0 for default smooth scroll, otherwise do not set values <10)",
    }
    return labelMap[schema.name as keyof typeof labelMap] || schema.name;
  }

  private _render = () => {
    render((<>
      <HassProvider hass={this._hass}>
      <ConfigProvider config={this._config}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <span>Set a per-page unique anchor ID to this card.</span>
        <span>To scroll to this anchor, navigate to it with a URL param via another card/action, example:</span>
        <code style={{
          backgroundColor: '#00000050',
          padding: '4px 8px',
          borderRadius: '4px',
        }}>
          /lovelace/lights?anchor=kitchen
        </code>
        <div style={{
          backgroundColor: '#00000050',
          padding: '4px 8px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
        }}><span>
          tap_action:{"\n"}
          {"  "}action: navigate{"\n"}
          {"  "}navigation_path: /lovelace/lights?anchor=kitchen{"\n"}
          {"  "}navigation_replace: true
        </span></div>
      </div>
      <FormComponent
        // hass={this._hass}
        // config={this._config}
        schema={[
          {name: 'anchor_id', selector: { text: {} }},
          {name: 'negative_margin', selector: { number: { min: -100, max: 100, step: 5 } }},
          {name: 'timeout', selector: { number: { min: 0, max: 1000, step: 10 } }},
          {name: 'offset', selector: { number: { min: -500, max: 500, step: 10 } }},
          {name: 'transition', selector: { number: { min: 0, max: 2000, step: 50 } }},
        ]}
        computeLabel={this.computeLabel}
        configChanged={this.configChanged.bind(this)}
      />
      <p>
        *
        {
          this.usedBackoutBefore ?
          <><b style={{
            color: 'red',
          }}>You used <code>backout</code> on this card, check this section:</b><br/></> :
          ''
        }
        If you navigate within the same page, use the
        {' '}
        <a href="https://www.home-assistant.io/dashboards/actions/#navigation_replace">navigation_replace</a>
        {' '}
        option on your navigation action to prevent having to go back multiple times to reach the previous page.
      </p>
      <p>
        *If you use the Sections view and want to edit this card, refresh the page
        {' '}
        <b style={{
          color: 'red',
        }}>when already in edit mode</b>
        {' '}
        (that's the only way to make it appear).
      </p>
      </ConfigProvider>
      </HassProvider>
    </>), this);
  }
}

customElements.define(parentCardName, AnchorCard);
customElements.define(configCardName, AnchorCardEditor);

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    customCards?: any[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: parentCardName,
  name: parentCardTitle,
  preview: false,
  description: 'A card that acts as a scroll anchor',
});
