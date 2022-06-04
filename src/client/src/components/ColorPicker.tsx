import { CSSProperties, useMemo } from "react";
import './ColorPicker.css';

type ColorPickerProps = {
  value: string;
  choices: string[];
  onChange: (value: string) => void;
  size: string;
};
export function ColorPicker(props: ColorPickerProps) {
  const value = props.value;
  const choices = props.choices;
  const onChange = props.onChange;
  const size = props.size;

  const colorStyles = useMemo(() => {

    const styleMap: Record<string, CSSProperties> = {};

    for(const color of choices) {
      styleMap[color] = {
        backgroundColor: color,
        width: size,
        height: size,
      };
    }

    return styleMap;

  }, [choices, size]);

  return (
    <div className="ColorPicker">
      <div className="choices">
        {choices.map(c => (
          <div key={c}
               className={'item' + (value === c ? ' selected' : '')}
               onClick={e => {
                 e.preventDefault();
                 e.stopPropagation();
                 if(onChange != null) {
                   onChange(c);
                 }
               }}
               style={colorStyles[c]}
          >
          </div>
        ))}
      </div>
    </div>
  )
}
