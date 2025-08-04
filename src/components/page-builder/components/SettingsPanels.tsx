import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderSection, PageBuilderRow, PageBuilderColumn } from '../types';

interface SectionSettingsPanelProps {
  section: PageBuilderSection;
  onUpdate: (updates: Partial<PageBuilderSection>) => void;
  onClose: () => void;
}

export const SectionSettingsPanel: React.FC<SectionSettingsPanelProps> = ({
  section,
  onUpdate,
  onClose
}) => {
  const handleStyleUpdate = (key: string, value: string) => {
    onUpdate({
      styles: { ...section.styles, [key]: value }
    });
  };

  const handleWidthUpdate = (width: 'full' | 'wide' | 'medium' | 'small') => {
    onUpdate({ width });
  };

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Section Settings</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>
          
          <TabsContent value="layout" className="space-y-4">
            <div>
              <Label htmlFor="section-width">Section Width</Label>
              <Select 
                value={section.width} 
                onValueChange={handleWidthUpdate}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="wide">Wide (1200px)</SelectItem>
                  <SelectItem value="medium">Medium (800px)</SelectItem>
                  <SelectItem value="small">Small (600px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label htmlFor="bg-color">Background Color</Label>
              <Input
                id="bg-color"
                type="color"
                value={section.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="padding">Padding</Label>
              <Input
                id="padding"
                placeholder="e.g., 20px"
                value={section.styles?.padding || ''}
                onChange={(e) => handleStyleUpdate('padding', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="margin">Margin</Label>
              <Input
                id="margin"
                placeholder="e.g., 10px 0"
                value={section.styles?.margin || ''}
                onChange={(e) => handleStyleUpdate('margin', e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface RowSettingsPanelProps {
  row: PageBuilderRow;
  onUpdate: (updates: Partial<PageBuilderRow>) => void;
  onClose: () => void;
}

export const RowSettingsPanel: React.FC<RowSettingsPanelProps> = ({
  row,
  onUpdate,
  onClose
}) => {
  const handleStyleUpdate = (key: string, value: string) => {
    onUpdate({
      styles: { ...row.styles, [key]: value }
    });
  };

  const handleLayoutChange = (layout: PageBuilderRow['columnLayout']) => {
    onUpdate({ columnLayout: layout });
  };

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Row Settings</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>
          
          <TabsContent value="layout" className="space-y-4">
            <div>
              <Label>Column Layout</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['1', '1-1', '1-2', '2-1', '1-1-1', '1-2-1'] as const).map((layout) => (
                  <Button
                    key={layout}
                    variant={row.columnLayout === layout ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLayoutChange(layout)}
                    className="text-xs"
                  >
                    {layout}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label htmlFor="row-bg-color">Background Color</Label>
              <Input
                id="row-bg-color"
                type="color"
                value={row.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="row-padding">Padding</Label>
              <Input
                id="row-padding"
                placeholder="e.g., 20px"
                value={row.styles?.padding || ''}
                onChange={(e) => handleStyleUpdate('padding', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="row-margin">Margin</Label>
              <Input
                id="row-margin"
                placeholder="e.g., 10px 0"
                value={row.styles?.margin || ''}
                onChange={(e) => handleStyleUpdate('margin', e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface ColumnSettingsPanelProps {
  column: PageBuilderColumn;
  onUpdate: (updates: Partial<PageBuilderColumn>) => void;
  onClose: () => void;
}

export const ColumnSettingsPanel: React.FC<ColumnSettingsPanelProps> = ({
  column,
  onUpdate,
  onClose
}) => {
  const handleStyleUpdate = (key: string, value: string) => {
    onUpdate({
      styles: { ...column.styles, [key]: value }
    });
  };

  const handleWidthUpdate = (width: number[]) => {
    onUpdate({ width: width[0] });
  };

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Column Settings</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>
          
          <TabsContent value="layout" className="space-y-4">
            <div>
              <Label>Column Width (1-12)</Label>
              <div className="mt-2">
                <Slider
                  value={[column.width]}
                  onValueChange={handleWidthUpdate}
                  max={12}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {column.width}/12 columns
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label htmlFor="col-bg-color">Background Color</Label>
              <Input
                id="col-bg-color"
                type="color"
                value={column.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="col-padding">Padding</Label>
              <Input
                id="col-padding"
                placeholder="e.g., 20px"
                value={column.styles?.padding || ''}
                onChange={(e) => handleStyleUpdate('padding', e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};