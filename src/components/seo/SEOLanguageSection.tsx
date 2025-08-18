import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SEOLanguageSectionProps {
  languageCode: string;
  onChange: (code: string) => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bengali' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

export const SEOLanguageSection: React.FC<SEOLanguageSectionProps> = ({
  languageCode,
  onChange
}) => {
  const selectedLanguage = languages.find(lang => lang.code === languageCode);

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 rounded px-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Language</span>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-2 pb-4 pt-2 space-y-3">
          <div>
            <Label>Language</Label>
            <Select value={languageCode} onValueChange={onChange}>
              <SelectTrigger className="mt-1 bg-background">
                <SelectValue>
                  {selectedLanguage ? `${selectedLanguage.code} - ${selectedLanguage.name}` : 'Select language'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50 max-h-48 overflow-y-auto">
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.code} - {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Sets the language code for search engines and accessibility
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};