interface CurrencyInputProps {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const formatCOP = (raw: string): string => {
  const num = Number(raw);
  if (!raw || isNaN(num)) return '';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const CurrencyInput = ({ value, onChange, placeholder = '0', className, required }: CurrencyInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      required={required}
      placeholder={placeholder}
      className={className}
      value={formatCOP(value)}
      onChange={handleChange}
    />
  );
};
