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

const DEFAULT_CONFIG = {
  negative_margin: 13,
  timeout: 250,
  offset: 0,
  transition: 0,
};

function delay(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

function afterPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
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
    this.handleLocationChanged = this.handleLocationChanged.bind(this);
  }

  static getConfigElement() {
    return document.createElement(configCardName);
  }

  static getStubConfig() {
    return {
      anchor_id: 'example',
      ...DEFAULT_CONFIG,
    }
  }

  private config?: Config;

  private scrollToken = 0;

  private handleLocationChanged() {
    this.scheduleScroll();
  }

  connectedCallback() {
    this.applyHiddenLayout();
    window.addEventListener('location-changed', this.handleLocationChanged);
    window.addEventListener('popstate', this.handleLocationChanged);
    window.addEventListener('hashchange', this.handleLocationChanged);
    this.scheduleScroll();
  }

  disconnectedCallback() {
    this.scrollToken += 1;
    window.removeEventListener('location-changed', this.handleLocationChanged);
    window.removeEventListener('popstate', this.handleLocationChanged);
    window.removeEventListener('hashchange', this.handleLocationChanged);
  }

  setConfig(config: Config) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._render();
    this.applyHiddenLayout();
    this.scheduleScroll();
  }

  private scheduleScroll() {
    if (!this.config || !this.isConnected) return;
    if (new URLSearchParams(window.location.search).get('edit') === '1') return;
    if (this.currentAnchor !== this.config.anchor_id) return;

    const token = ++this.scrollToken;
    this.scrollWhenReady(token);
  }

  private async scrollWhenReady(token: number) {
    if (!this.config) return;

    const waitTime = Number(this.config.timeout ?? DEFAULT_CONFIG.timeout);
    const deadline = performance.now() + Math.max(waitTime, 2000);

    await delay(waitTime);
    await afterPaint();

    while (token === this.scrollToken && performance.now() < deadline) {
      const target = this.findScrollTarget();

      if (target && this.hasUsableRect(target)) {
        await afterPaint();
        this.scrollToTarget(target);
        this.clearAnchorParam();
        return;
      }

      await delay(100);
    }

    if (token === this.scrollToken) {
      this.scrollToTarget(this.findScrollTarget() || this);
      this.clearAnchorParam();
    }
  }

  private get currentAnchor() {
    return new URLSearchParams(window.location.search).get('anchor');
  }

  private findHostCard(): HTMLElement | undefined {
    let element = this.parentElement;

    while (element) {
      if (element.localName === 'hui-card') return element;
      element = element.parentElement;
    }

    return undefined;
  }

  private findScrollTarget(): HTMLElement | undefined {
    const hostCard = this.findHostCard();
    const stackSibling = this.nextVisibleSibling(hostCard?.nextElementSibling);

    if (stackSibling) return stackSibling;

    const gridWrapper = hostCard?.parentElement?.classList.contains('card') ?
      hostCard.parentElement :
      undefined;
    const gridSibling = this.nextVisibleSibling(gridWrapper?.nextElementSibling);

    if (gridSibling) return gridSibling;

    return hostCard || this;
  }

  private nextVisibleSibling(element: Element | null | undefined): HTMLElement | undefined {
    let candidate = element;

    while (candidate) {
      if (
        candidate instanceof HTMLElement &&
        !candidate.hidden &&
        getComputedStyle(candidate).display !== 'none'
      ) {
        return candidate;
      }
      candidate = candidate.nextElementSibling;
    }

    return undefined;
  }

  private hasUsableRect(element: Element): boolean {
    if (!element.isConnected) return false;

    const rect = element.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  private scrollToTarget(element: Element) {
    if (!this.config) return;

    const rect = element.getBoundingClientRect();
    const offset = Number(this.config.offset || 0);
    const targetPosition = rect.top + window.scrollY + offset;

    if (Number(this.config.transition) > 0) {
      smoothScrollTo(targetPosition, Number(this.config.transition));
    } else {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  }

  private clearAnchorParam() {
    const url = new URL(window.location.href);

    if (!url.searchParams.has('anchor')) return;

    url.searchParams.delete('anchor');
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  private applyHiddenLayout() {
    if (!this.config) return;

    const negativeMargin = Number(this.config.negative_margin ?? DEFAULT_CONFIG.negative_margin);
    this.style.display = 'block';
    this.style.height = '0px';
    this.style.maxHeight = '0px';
    this.style.minHeight = '0px';
    this.style.overflow = 'visible';
    this.style.margin = `-${negativeMargin}px 0 0 0`;
    this.style.padding = '0';
    this.style.border = '0';

    const hostCard = this.findHostCard();

    if (hostCard) {
      hostCard.style.height = '0px';
      hostCard.style.maxHeight = '0px';
      hostCard.style.minHeight = '0px';
      hostCard.style.overflow = 'visible';
      hostCard.style.margin = '0';
      hostCard.style.padding = '0';
    }

    const gridWrapper = hostCard?.parentElement;

    if (gridWrapper?.classList.contains('card')) {
      gridWrapper.style.height = '0px';
      gridWrapper.style.maxHeight = '0px';
      gridWrapper.style.minHeight = '0px';
      gridWrapper.style.overflow = 'visible';
    }
  }

  private _render = () => {
    if (!this.config) return;

    render(
      (
        <>
          <ha-card style={{
            margin: `-${this.config.negative_margin || DEFAULT_CONFIG.negative_margin}px 0`,
            borderWidth: '0px',
            maxHeight: '0px',
            height: '0px',
            minHeight: '0px',
            overflow: 'visible',
            transform: 'scale(0)',
          } as JSXInternal.CSSProperties}
          />
        </>
      ), this,
    );
  };

  getCardSize() {
    return 0;
  }

  getGridOptions() {
    return { columns: 1, rows: 0 };
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
      config.backout !== undefined ||
      // @ts-ignore
      config.disable_in_edit_mode !== undefined
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
        // @ts-ignore
        disable_in_edit_mode: undefined,
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
