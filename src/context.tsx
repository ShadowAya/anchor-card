/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
import { FunctionComponent, createContext, h } from 'preact';
import { HomeAssistant } from 'custom-card-helpers';
import { Config } from 'types';

export const HassContext = createContext<HomeAssistant | undefined>(undefined);
export const ConfigContext = createContext<Config | undefined>(undefined);

interface HassProviderProps {
  hass: HomeAssistant;
  children: h.JSX.Element | h.JSX.Element[];
}

interface ConfigProviderProps {
  config: Config;
  children: h.JSX.Element | h.JSX.Element[];
}

export const HassProvider: FunctionComponent<HassProviderProps> = ({ hass, children }) => (
  <HassContext.Provider value={hass}>
    {children}
  </HassContext.Provider>
);

export const ConfigProvider: FunctionComponent<ConfigProviderProps> = ({ config, children }) => (
  <ConfigContext.Provider value={config}>
    {children}
  </ConfigContext.Provider>
);
