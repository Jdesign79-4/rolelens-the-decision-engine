import React from 'react';
import { Shield, ExternalLink, Database, Activity, Landmark, LineChart, FileText } from 'lucide-react';

export default function DataSources() {
  return (
    <div className="min-h-screen bg-[#F0EAE1] dark:bg-slate-900 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" /> Data Sources & Attribution
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            RoleLens relies on publicly available, verified data sources to provide accurate market intelligence.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <div className="p-6 md:p-8 space-y-8">
            
            <section className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg h-fit">
                <Landmark className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">U.S. Department of Labor (O*NET & CareerOneStop)</h3>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-blue-400">
                  <p className="mb-2">"This site incorporates information from O*NET Web Services by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). O*NET® is a trademark of USDOL/ETA."</p>
                  <p>"Data provided by CareerOneStop, sponsored by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA) and the Minnesota Department of Employment and Economic Development (DEED)."</p>
                </div>
                <p className="mt-2 text-sm text-slate-500">Used for: Career growth metrics, occupation outlooks, related roles, skills, and compensation estimates.</p>
              </div>
            </section>

            <section className="flex gap-4">
              <div className="mt-1 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg h-fit">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Bureau of Labor Statistics (BLS) & FRED (JOLTS)</h3>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-emerald-400">
                  <p>"Labor statistics from the U.S. Bureau of Labor Statistics (BLS). BLS data is in the public domain."</p>
                  <p className="mt-2">"Job Openings and Labor Turnover Survey (JOLTS) data retrieved from FRED, Federal Reserve Bank of St. Louis."</p>
                </div>
                <p className="mt-2 text-sm text-slate-500">Used for: Real-time supply/demand ratios, job opening rates by industry, and macroeconomic trend analysis.</p>
              </div>
            </section>

            <section className="flex gap-4">
              <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg h-fit">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">SEC EDGAR</h3>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-indigo-400">
                  <p>"Financial data from SEC EDGAR. SEC filings are public domain."</p>
                </div>
                <p className="mt-2 text-sm text-slate-500">Used for: SEC 10-K and 10-Q filings, XBRL revenue facts, and corporate financial health metrics.</p>
              </div>
            </section>

            <section className="flex gap-4">
              <div className="mt-1 p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg h-fit">
                <LineChart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Market & Risk Data Providers</h3>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-rose-400">
                  <p>"Market data from Alpha Vantage, Finnhub, and WARN Firehose. WARN Act notices are public records filed with state labor departments."</p>
                </div>
                <p className="mt-2 text-sm text-slate-500">Used for: Live stock prices, analyst consensus ratings, news sentiment analysis, and official layoff notice tracking.</p>
              </div>
            </section>

          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-slate-400" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">About AI Analysis</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed ml-8">
              RoleLens uses Large Language Models (LLMs) to synthesize, summarize, and categorize this public data into actionable insights. While the underlying data comes from the official sources listed above, the scoring algorithms, "real feel" derivations, and strategic advice are AI-generated estimations. Always verify critical facts independently before making major career decisions.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}