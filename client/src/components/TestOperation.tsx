import { useState } from "react";
import './TestOperation.css';

type OpParamString = {
  type?: 'string';
  defaultValue?: string;
}
type OpParamBool = {
  type: 'boolean';
  defaultValue?: boolean;
}
type OpParamNumber = {
  type: 'number';
  defaultValue?: number;
}
type OpParam = {
  paramName: string;
} & (OpParamString | OpParamNumber | OpParamBool);
type Props = {
  label: string;
  params?: OpParam[];
  exec: (input: Record<string, any>) => Promise<any>;
}
export function TestOperation(props: Props) {
  const {
    label,
    params = [],
    exec,
  } = props;

  const defaultValues: Record<string, string | number | boolean> = {};
  for (const param of params) {
    if(param.type === 'boolean') {
      defaultValues[param.paramName] = param.defaultValue ?? false;
    } else if(param.type === 'number') {
      defaultValues[param.paramName] = param.defaultValue ?? 0;
    } else {
      // string (or undefined, but that is string by default)
      defaultValues[param.paramName] = param.defaultValue ?? '';
    }
  }
  const [ values, setValues ] = useState(defaultValues);

  const [ results, setResults ] = useState<string | null>(null);

  return (
    <div className="TestOperation">
      <div>
        {label}:
      </div>
      {params.map((param) => (
        <div key={param.paramName}>
          <label>
            {param.type === 'boolean' ? (
              <label>
                <input type="checkbox"
                       checked={values[param.paramName] as boolean}
                       onChange={(e) => {
                         setValues({ ...values, [param.paramName]: e.target.checked });
                       }}
                />
                {' '}
                {param.paramName}
              </label>
            ) : param.type === 'number' ? (
              <label>
                {param.paramName}:{' '}
                <input type="text"
                       value={String(values[param.paramName] as number)}
                       onChange={(e) => {
                         setValues({ ...values, [param.paramName]: e.target.value });
                       }}
                       onBlur={(e) => {
                         let val = parseFloat(e.target.value);
                         if(isNaN(val)) {
                           val = param.defaultValue ?? 0;
                         }
                         setValues({ ...values, [param.paramName]: val});
                       }}
                />
              </label>
            ) : (
              <label>
                {param.paramName}:{' '}
                <input type="text"
                       value={values[param.paramName] as string}
                       onChange={(e) => {
                         setValues({ ...values, [param.paramName]: e.target.value });
                       }}
                />
              </label>
            )}
          </label>
        </div>
      ))}
      <div>
        <button onClick={async () => {
          const result = await exec(values);
          setResults(JSON.stringify(result, undefined, 2));
        }}>Go</button>
      </div>
      {results != null ? (
        <div className="TestOperation--result">
          <div className="TestOperation--result--header">
            <div>
              Result:
            </div>
            <div>
              <button onClick={() => setResults(null)}>Clear</button>
            </div>
          </div>
          <pre dangerouslySetInnerHTML={{__html: results}}>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
