import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { KeyRound, CheckCircle2, XCircle, Loader2, Eye, EyeOff, ExternalLink, Shield, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const API_PROVIDERS = [
  {
    id: 'alpha_vantage_api_key',
    provider: 'ALPHA_VANTAGE',
    label: 'Alpha Vantage API Key',
    helperText: 'Free at alphavantage.co/support/#api-key — Used for earnings data and news sentiment (25 requests/day)',
    link: 'https://www.alphavantage.co/support/#api-key'
  },
  {
    id: 'fmp_api_key',
    provider: 'FMP',
    label: 'Financial Modeling Prep API Key',
    helperText: 'Free at financialmodelingprep.com/developer/docs — Used for employee headcount trends (250 requests/day)',
    link: 'https://financialmodelingprep.com/developer/docs'
  },
  {
    id: 'finnhub_api_key',
    provider: 'FINNHUB',
    label: 'Finnhub API Key',
    helperText: 'Free at finnhub.io/register — Used for analyst recommendations and company news (60 calls/min)',
    link: 'https://finnhub.io/register'
  },
  {
    id: 'career_one_stop_user_id',
    provider: 'CAREER_ONE_STOP',
    label: 'CareerOneStop User ID',
    helperText: 'Free at careeronestop.org/Developers/WebAPI/registration.aspx — Used for salary data',
    link: 'https://www.careeronestop.org/Developers/WebAPI/registration.aspx',
    isUserId: true
  },
  {
    id: 'career_one_stop_api_key',
    provider: 'CAREER_ONE_STOP',
    label: 'CareerOneStop API Token',
    helperText: 'Provided during CareerOneStop registration — Used for salary and occupation data',
    link: 'https://www.careeronestop.org/Developers/WebAPI/registration.aspx'
  },
  {
    id: 'bls_api_key',
    provider: 'BLS',
    label: 'BLS API Key (v2)',
    helperText: 'Free at data.bls.gov/registrationEngine/ — Used for wage statistics (500 queries/day)',
    link: 'https://data.bls.gov/registrationEngine/'
  },
  {
    id: 'onet_api_key',
    provider: 'ONET',
    label: 'O*NET Web Services API Key',
    helperText: 'Free at services.onetcenter.org/developer — Used for occupation outlook and career growth data',
    link: 'https://services.onetcenter.org/developer'
  },
  {
    id: 'fred_api_key',
    provider: 'FRED',
    label: 'FRED API Key',
    helperText: 'Free at fred.stlouisfed.org/docs/api/api_key.html — Used for JOLTS labor market data',
    link: 'https://fred.stlouisfed.org/docs/api/api_key.html'
  }
];

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState({});
  const [hasKeys, setHasKeys] = useState({});
  const [editingFields, setEditingFields] = useState({});
  const [testStatus, setTestStatus] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await base44.functions.invoke('manageApiKeys', { action: 'load' });
        if (res.data) {
          setKeys(res.data.keys || {});
          setHasKeys(res.data.hasKeys || {});
        }
      } catch (e) {
        console.error("Failed to load API keys", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadKeys();
  }, []);

  const handleChange = (id, value) => {
    setKeys(prev => ({ ...prev, [id]: value }));
    setEditingFields(prev => ({ ...prev, [id]: true }));
    setTestStatus(prev => ({ ...prev, [id]: null }));
  };

  const startEditing = (id) => {
    // Clear the masked value so user can type a new key
    setKeys(prev => ({ ...prev, [id]: '' }));
    setEditingFields(prev => ({ ...prev, [id]: true }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.functions.invoke('manageApiKeys', { action: 'save', keys });
      toast({
        title: "Settings Saved",
        description: "Your API keys have been encrypted and saved securely.",
      });
      // Reload to get fresh masked values
      const res = await base44.functions.invoke('manageApiKeys', { action: 'load' });
      if (res.data) {
        setKeys(res.data.keys || {});
        setHasKeys(res.data.hasKeys || {});
        setEditingFields({});
      }
    } catch (e) {
      toast({
        title: "Error Saving",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (providerConfig) => {
    const keyVal = keys[providerConfig.id];
    const isEditing = editingFields[providerConfig.id];

    if (!keyVal && !hasKeys[providerConfig.id]) {
      setTestStatus(prev => ({ ...prev, [providerConfig.id]: { loading: false, success: false, message: "Please enter a key first" }}));
      return;
    }

    setTestStatus(prev => ({ ...prev, [providerConfig.id]: { loading: true }}));

    try {
      const payload = {
        provider: providerConfig.provider,
        keyField: providerConfig.id,
        keyValue: isEditing ? keyVal : null, // null = test existing stored key
      };

      if (providerConfig.provider === 'CAREER_ONE_STOP' && !providerConfig.isUserId) {
        payload.userId = editingFields['career_one_stop_user_id'] ? keys['career_one_stop_user_id'] : null;
      }

      const res = await base44.functions.invoke('manageApiKeys', { action: 'test', keys: payload });
      
      if (res.data) {
        setTestStatus(prev => ({ 
          ...prev, 
          [providerConfig.id]: { 
            loading: false, 
            success: res.data.success, 
            message: res.data.message 
          }
        }));
      } else {
        throw new Error("No response from server");
      }
    } catch (e) {
      setTestStatus(prev => ({ 
        ...prev, 
        [providerConfig.id]: { 
          loading: false, 
          success: false, 
          message: e.message || "Test failed" 
        }
      }));
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F0EAE1] dark:bg-slate-900 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-indigo-600" /> API Keys Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Configure external integrations for real-time market intelligence.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8"
        >
          {/* Security notice */}
          <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-800">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Your API keys are encrypted and secured
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Keys are encrypted server-side before storage and are never exposed in plain text. Only masked previews are shown here. Keys are decrypted only when needed by backend services.
              </p>
            </div>
          </div>

          <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-start gap-3 border border-indigo-100 dark:border-indigo-800">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-indigo-900 dark:text-indigo-200">
                <strong>RoleLens uses free public APIs to provide verified, real-time data.</strong> All API keys below are free to obtain. No credit card required.
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
                Note: SEC EDGAR data requires no API key.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {API_PROVIDERS.map((provider) => {
              const status = testStatus[provider.id];
              const isEditing = editingFields[provider.id];
              const hasExisting = hasKeys[provider.id];

              return (
                <div key={provider.id} className="border-b border-slate-100 dark:border-slate-700/50 pb-8 last:border-0 last:pb-0">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {provider.label}
                      </label>
                      <a href={provider.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                        {provider.helperText.split('—')[0]} <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-xs text-slate-500 mt-1">
                        {provider.helperText.split('—')[1]}
                      </p>
                    </div>
                    {hasExisting && !isEditing && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <Lock className="w-3 h-3" /> Encrypted
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      {hasExisting && !isEditing ? (
                        // Show masked value with replace button
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 font-mono tracking-wider">
                            {keys[provider.id] || '••••••••'}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startEditing(provider.id)}
                          >
                            Replace
                          </Button>
                        </div>
                      ) : (
                        // Show editable input
                        <Input
                          type="password"
                          value={keys[provider.id] || ""}
                          onChange={(e) => handleChange(provider.id, e.target.value)}
                          placeholder="Paste new key here..."
                          className="bg-slate-50 dark:bg-slate-900"
                          autoComplete="off"
                        />
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => handleTest(provider)}
                      disabled={status?.loading || (!isEditing && !hasExisting)}
                      className="w-full sm:w-auto"
                    >
                      {status?.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Test Connection"}
                    </Button>
                  </div>

                  {status && !status.loading && (
                    <div className={`mt-2 flex items-center gap-2 text-sm ${status.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {status.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{status.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              Encrypt & Save All Keys
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}