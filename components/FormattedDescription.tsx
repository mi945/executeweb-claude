import { parseDescription } from '@/lib/formatDescription';

interface FormattedDescriptionProps {
  text: string;
  className?: string;
  clamp?: boolean;
}

export default function FormattedDescription({ text, className = '', clamp = false }: FormattedDescriptionProps) {
  if (!text) return null;

  return (
    <div
      className={`whitespace-pre-wrap ${clamp ? 'line-clamp-2' : ''} ${className}`}
    >
      {parseDescription(text)}
    </div>
  );
}
