/* eslint-disable react/prop-types */
import { useContext, useEffect, useRef } from 'preact/hooks';
import { ConfigContext, HassContext } from 'context';
import { JSX } from 'preact/jsx-runtime';

interface CustomHaFormProps {
  schema: any;
  computeLabel: (schema: { name: string }) => string;
  configChanged: (e: any) => void;
}

const FormComponent = ({ schema, computeLabel, configChanged }: CustomHaFormProps) => {
  const hass = useContext(HassContext);
  const config = useContext(ConfigContext);
  const haFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const haForm = document.createElement('ha-form') as unknown as JSX.IntrinsicElements['ha-form'];
    haForm.hass = hass;
    haForm.data = config;
    haForm.schema = schema;
    haForm.computeLabel = computeLabel;

    haForm.addEventListener('value-changed', configChanged);

    if (haFormRef.current) {
      /* @ts-ignore */
      haFormRef.current.appendChild(haForm);
    }

    return () => {
      haForm.removeEventListener('value-changed', configChanged);
    };
  }, []);

  return <div ref={haFormRef}></div>;
};

export default FormComponent;
