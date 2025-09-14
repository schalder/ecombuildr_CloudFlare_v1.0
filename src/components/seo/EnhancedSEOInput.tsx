import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface EnhancedSEOInputProps {
  label: string;
  value?: string;
  placeholder?: string;
  maxLength: number;
  type?: 'input' | 'textarea';
  onChange: (value: string) => void;
  helpText?: string;
}

export const EnhancedSEOInput: React.FC<EnhancedSEOInputProps> = ({
  label,
  value = '',
  placeholder,
  maxLength,
  type = 'input',
  onChange,
  helpText
}) => {
  const currentLength = value.length;
  const isOverLimit = currentLength > maxLength;
  const isNearLimit = currentLength > maxLength * 0.8;

  const getCounterVariant = () => {
    if (isOverLimit) return 'destructive';
    if (isNearLimit) return 'secondary';
    return 'outline';
  };

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Badge variant={getCounterVariant()} className="text-xs">
          {currentLength}/{maxLength}
        </Badge>
      </div>
      
      <InputComponent
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={isOverLimit ? 'border-destructive' : ''}
      />
      
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      
      {isOverLimit && (
        <p className="text-xs text-destructive">
          Content exceeds recommended length by {currentLength - maxLength} characters
        </p>
      )}
    </div>
  );
};