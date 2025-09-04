import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SupportSettings {
  id: string;
  whatsapp_number: string;
  welcome_message: string;
  is_enabled: boolean;
  widget_position: string;
  availability_message: string;
}

export const WhatsAppWidget = () => {
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupportSettings();
  }, []);

  const fetchSupportSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_support_settings')
        .select('*')
        .eq('is_enabled', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching support settings:', error);
      } else if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!settings) return;

    const rawMessage = settings.welcome_message || '';
    const message = encodeURIComponent(rawMessage);
    const phoneNumber = settings.whatsapp_number.replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${message}&type=phone_number&app_absent=0`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (loading || !settings || !settings.is_enabled) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  const position = settings.widget_position as keyof typeof positionClasses;

  return (
    <div className={`whatsapp-widget fixed ${positionClasses[position] || positionClasses['bottom-right']} z-50`}>
      {!isMinimized && (
        <div className="mb-4 bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">Need Help?</p>
                <p className="text-xs text-muted-foreground">We're here to assist!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {settings.availability_message}
          </p>
          <Button
            onClick={openWhatsApp}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            size="sm"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </div>
      )}
      
      <Button
        onClick={isMinimized ? () => setIsMinimized(false) : openWhatsApp}
        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
};