import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Settings, Send, ChevronDown, ChevronRight } from 'lucide-react';
import { PageBuilderElement, FormField } from '../types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface FormPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

interface FunnelStep {
  id: string;
  title: string;
  slug: string;
}

export const FormProperties: React.FC<FormPropertiesProps> = ({ element, onUpdate }) => {
  const { funnelId } = useParams();
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<FormField>>({
    type: 'singleLineText',
    label: '',
    placeholder: '',
    required: false
  });

  // Collapsible sections state
  const [formSettingsOpen, setFormSettingsOpen] = useState(true);
  const [formFieldsOpen, setFormFieldsOpen] = useState(true);
  const [submitButtonOpen, setSubmitButtonOpen] = useState(true);

  // Load funnel steps for redirect options
  React.useEffect(() => {
    if (funnelId && element.content.submitAction === 'step') {
      const loadFunnelSteps = async () => {
        const { data, error } = await supabase
          .from('funnel_steps')
          .select('id, title, slug')
          .eq('funnel_id', funnelId)
          .eq('is_published', true)
          .order('step_order');
        
        if (!error && data) {
          setFunnelSteps(data);
        }
      };
      loadFunnelSteps();
    }
  }, [funnelId, element.content.submitAction]);

  const fields = element.content.fields || [];
  const formName = element.content.formName || '';
  const buttonText = element.content.buttonText || '';
  const submitAction = element.content.submitAction || 'url';
  const redirectUrl = element.content.redirectUrl || '';
  const redirectStepId = element.content.redirectStepId || '';
  const successMessage = element.content.successMessage || '';

  const addField = () => {
    if (!newField.label) return;
    
    const field: FormField = {
      id: `field-${Date.now()}`,
      type: newField.type as any,
      label: newField.label,
      placeholder: newField.placeholder || '',
      required: newField.required || false
    };

    onUpdate('fields', [...fields, field]);
    setNewField({
      type: 'singleLineText',
      label: '',
      placeholder: '',
      required: false
    });
    setShowAddField(false);
  };

  const removeField = (fieldId: string) => {
    onUpdate('fields', fields.filter(field => field.id !== fieldId));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    onUpdate('fields', fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const newFields = Array.from(fields);
    const [reorderedItem] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, reorderedItem);

    onUpdate('fields', newFields);
  };

  const fieldTypeOptions = [
    { value: 'fullName', label: 'Full Name' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'address', label: 'Address' },
    { value: 'singleLineText', label: 'Single Line Text' },
    { value: 'textBox', label: 'Text Box' },
  ];

  return (
    <div className="space-y-6">
      {/* Form Settings */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setFormSettingsOpen(!formSettingsOpen)}
        >
          <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Settings className="h-3 w-3" />
            Form Settings
            {formSettingsOpen ? (
              <ChevronDown className="h-3 w-3 ml-auto" />
            ) : (
              <ChevronRight className="h-3 w-3 ml-auto" />
            )}
          </CardTitle>
        </CardHeader>
        {formSettingsOpen && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="formName">Form Name</Label>
              <Input
                id="formName"
                value={formName}
                onChange={(e) => onUpdate('formName', e.target.value)}
                placeholder="Enter form name"
              />
            </div>
            
            <div>
              <Label htmlFor="successMessage">Success Message</Label>
              <Textarea
                id="successMessage"
                value={successMessage}
                onChange={(e) => onUpdate('successMessage', e.target.value)}
                placeholder="Enter success message"
                rows={2}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Field Management */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setFormFieldsOpen(!formFieldsOpen)}
        >
          <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className="flex items-center gap-2">
              <GripVertical className="h-3 w-3" />
              Form Fields
              {formFieldsOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
            {formFieldsOpen && (
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddField(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-3 w-3" />
                Add Field
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {formFieldsOpen && (
          <CardContent>
          {showAddField && (
            <Card className="mb-4 border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Field Type</Label>
                      <Select 
                        value={newField.type} 
                        onValueChange={(value) => setNewField(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="required"
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked }))}
                        />
                        <Label htmlFor="required">Required</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Field Label</Label>
                    <Input
                      value={newField.label}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Enter field label"
                    />
                  </div>
                  
                  <div>
                    <Label>Placeholder (Optional)</Label>
                    <Input
                      value={newField.placeholder}
                      onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="Enter placeholder text"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addField}>
                      Add Field
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddField(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border rounded-md p-3 bg-background ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              <div className="flex items-center gap-2 flex-1">
                                <Badge variant="outline">
                                  {fieldTypeOptions.find(opt => opt.value === field.type)?.label}
                                </Badge>
                                {field.required && (
                                  <span className="text-red-500 text-sm">*</span>
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeField(field.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                placeholder="Field label"
                              />
                              <Input
                                value={field.placeholder}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                placeholder="Placeholder"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          </CardContent>
        )}
      </Card>

      {/* Submit Button Settings */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setSubmitButtonOpen(!submitButtonOpen)}
        >
          <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Send className="h-3 w-3" />
            Submit Button
            {submitButtonOpen ? (
              <ChevronDown className="h-3 w-3 ml-auto" />
            ) : (
              <ChevronRight className="h-3 w-3 ml-auto" />
            )}
          </CardTitle>
        </CardHeader>
        {submitButtonOpen && (
          <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={buttonText}
                      onChange={(e) => onUpdate('buttonText', e.target.value)}
                      placeholder="Enter button text"
                    />
                  </div>
                  
                  <div>
                    <Label>Button Size</Label>
                    <Select 
                      value={element.content.buttonSize || 'default'} 
                      onValueChange={(value) => onUpdate('buttonSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select button size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
          
          <div>
            <Label>Submit Action</Label>
            <Select 
              value={submitAction} 
              onValueChange={(value) => onUpdate('submitAction', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">Redirect to URL</SelectItem>
                <SelectItem value="step">Redirect to Funnel Step</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {submitAction === 'url' && (
            <div>
              <Label htmlFor="redirectUrl">Redirect URL</Label>
              <Input
                id="redirectUrl"
                value={redirectUrl}
                onChange={(e) => onUpdate('redirectUrl', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}
          
          {submitAction === 'step' && (
            <div>
              <Label>Select Funnel Step</Label>
              <Select 
                value={redirectStepId} 
                onValueChange={(value) => onUpdate('redirectStepId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a step" />
                </SelectTrigger>
                <SelectContent>
                  {funnelSteps.map(step => (
                    <SelectItem key={step.id} value={step.slug}>
                      {step.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
