import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MemberAccount {
  id: string;
  store_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

interface MemberAuthContextType {
  member: MemberAccount | null;
  loading: boolean;
  signIn: (email: string, password: string, storeId: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export const useMemberAuth = () => {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error('useMemberAuth must be used within a MemberAuthProvider');
  }
  return context;
};

export const MemberAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [member, setMember] = useState<MemberAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing member session
    const memberData = localStorage.getItem('member_session');
    if (memberData) {
      try {
        const parsed = JSON.parse(memberData);
        setMember(parsed);
      } catch (error) {
        localStorage.removeItem('member_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string, storeId: string) => {
    try {
      setLoading(true);
      
      // Call member login edge function
      const { data, error } = await supabase.functions.invoke('member-login', {
        body: { email, password, store_id: storeId }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.error) {
        return { error: data.error };
      }

      const memberAccount = data.member;
      
      // Check access status
      if (memberAccount.access_status === 'pending') {
        return { error: 'Your account is pending approval. Please contact support or wait for verification.' };
      }
      
      if (memberAccount.access_status === 'suspended') {
        return { error: 'Your account has been suspended. Please contact support.' };
      }

      setMember(memberAccount);
      localStorage.setItem('member_session', JSON.stringify(memberAccount));
      
      // Update last login
      await supabase
        .from('member_accounts')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', memberAccount.id);

      toast.success('Welcome back!');
      return { error: null };
    } catch (error) {
      console.error('Member sign in error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setMember(null);
    localStorage.removeItem('member_session');
    toast.success('Signed out successfully');
  };

  return (
    <MemberAuthContext.Provider value={{ member, loading, signIn, signOut }}>
      {children}
    </MemberAuthContext.Provider>
  );
};