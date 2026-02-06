import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import jsPDF from 'jspdf';

export default function ReportExporter({ currentJob, tunerSettings, insights, onClose }) {
  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    compensation: true,
    stability: true,
    culture: true,
    aiInsights: true,
    tunerSettings: true,
    alternatives: true
  });

  const toggleSection = (section) => {
    setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    const addText = (text, fontSize = 12, isBold = false) => {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.text(text, margin, yPos);
      yPos += lineHeight;
    };

    const addSection = (title, content) => {
      yPos += 5;
      addText(title, 14, true);
      yPos += 2;
      if (Array.isArray(content)) {
        content.forEach(line => addText(line, 11));
      } else {
        addText(content, 11);
      }
      yPos += 3;
    };

    // Header
    addText('RoleLens Career Analysis Report', 18, true);
    addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
    yPos += 5;

    // Summary
    if (selectedSections.summary) {
      addSection('Job Summary', [
        `Company: ${currentJob.meta.company}`,
        `Position: ${currentJob.meta.title}`,
        `Location: ${currentJob.meta.location}`,
        `Date Posted: ${currentJob.meta.date}`
      ]);
    }

    // Compensation
    if (selectedSections.compensation) {
      addSection('Compensation Analysis', [
        `Headline Offer: $${currentJob.comp.headline.toLocaleString()}`,
        `Real Feel Salary: $${currentJob.comp.real_feel.toLocaleString()}`,
        `Base: $${currentJob.comp.base.toLocaleString()}`,
        `Equity Value: $${currentJob.comp.equity.toLocaleString()}`,
        `Tax Rate: ${(currentJob.comp.tax_rate * 100).toFixed(1)}%`,
        `COL Adjustment: ${(currentJob.comp.col_adjustment * 100).toFixed(1)}%`
      ]);
    }

    // Stability
    if (selectedSections.stability) {
      addSection('Stability & Risk', [
        `Overall Health: ${currentJob.stability.health}`,
        `Risk Score: ${(currentJob.stability.risk_score * 100).toFixed(1)}%`,
        `Division: ${currentJob.stability.division}`,
        `Runway: ${currentJob.stability.runway}`,
        `Headcount Trend: ${currentJob.stability.headcount_trend}`
      ]);
    }

    // Culture
    if (selectedSections.culture) {
      addSection('Culture & Work-Life Balance', [
        `Type: ${currentJob.culture.type}`,
        `Work-Life Balance: ${currentJob.culture.wlb_score}/10`,
        `Career Growth: ${currentJob.culture.growth_score}/10`,
        `Stress Level: ${(currentJob.culture.stress_level * 100).toFixed(1)}%`,
        `Politics Level: ${currentJob.culture.politics_level}`
      ]);
    }

    // AI Insights
    if (selectedSections.aiInsights && insights) {
      if (insights.culture) {
        addSection('AI Culture Analysis', 
          insights.culture.split('\n').filter(line => line.trim())
        );
      }
      if (insights.compensation) {
        addSection('AI Compensation Forecast', 
          insights.compensation.split('\n').filter(line => line.trim())
        );
      }
      if (insights.career) {
        addSection('AI Career Path Recommendations', 
          insights.career.split('\n').filter(line => line.trim())
        );
      }
    }

    // Tuner Settings
    if (selectedSections.tunerSettings) {
      addSection('Your Profile Settings', [
        `Risk Appetite: ${(tunerSettings.riskAppetite * 100).toFixed(0)}%`,
        `Life Anchors: ${(tunerSettings.lifeAnchors * 100).toFixed(0)}%`,
        `Career Stage: ${(tunerSettings.careerStage * 100).toFixed(0)}%`,
        `Self-Reflection: ${(tunerSettings.honestSelfReflection * 100).toFixed(0)}%`
      ]);
    }

    // Save
    doc.save(`RoleLens_${currentJob.meta.company}_${currentJob.meta.title.replace(/\s/g, '_')}_Report.pdf`);
  };

  const generateCSV = () => {
    let csv = 'Category,Metric,Value\n';

    if (selectedSections.summary) {
      csv += `Summary,Company,${currentJob.meta.company}\n`;
      csv += `Summary,Position,${currentJob.meta.title}\n`;
      csv += `Summary,Location,${currentJob.meta.location}\n`;
      csv += `Summary,Date Posted,${currentJob.meta.date}\n`;
    }

    if (selectedSections.compensation) {
      csv += `Compensation,Headline Offer,$${currentJob.comp.headline}\n`;
      csv += `Compensation,Real Feel Salary,$${currentJob.comp.real_feel}\n`;
      csv += `Compensation,Base,$${currentJob.comp.base}\n`;
      csv += `Compensation,Equity,$${currentJob.comp.equity}\n`;
      csv += `Compensation,Tax Rate,${(currentJob.comp.tax_rate * 100).toFixed(1)}%\n`;
      csv += `Compensation,COL Adjustment,${(currentJob.comp.col_adjustment * 100).toFixed(1)}%\n`;
    }

    if (selectedSections.stability) {
      csv += `Stability,Health,${currentJob.stability.health}\n`;
      csv += `Stability,Risk Score,${(currentJob.stability.risk_score * 100).toFixed(1)}%\n`;
      csv += `Stability,Division,${currentJob.stability.division}\n`;
      csv += `Stability,Runway,${currentJob.stability.runway}\n`;
      csv += `Stability,Headcount Trend,${currentJob.stability.headcount_trend}\n`;
    }

    if (selectedSections.culture) {
      csv += `Culture,Type,${currentJob.culture.type}\n`;
      csv += `Culture,Work-Life Balance,${currentJob.culture.wlb_score}/10\n`;
      csv += `Culture,Career Growth,${currentJob.culture.growth_score}/10\n`;
      csv += `Culture,Stress Level,${(currentJob.culture.stress_level * 100).toFixed(1)}%\n`;
      csv += `Culture,Politics Level,${currentJob.culture.politics_level}\n`;
    }

    if (selectedSections.tunerSettings) {
      csv += `Profile,Risk Appetite,${(tunerSettings.riskAppetite * 100).toFixed(0)}%\n`;
      csv += `Profile,Life Anchors,${(tunerSettings.lifeAnchors * 100).toFixed(0)}%\n`;
      csv += `Profile,Career Stage,${(tunerSettings.careerStage * 100).toFixed(0)}%\n`;
      csv += `Profile,Self-Reflection,${(tunerSettings.honestSelfReflection * 100).toFixed(0)}%\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoleLens_${currentJob.meta.company}_${currentJob.meta.title.replace(/\s/g, '_')}_Data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const allSelected = Object.values(selectedSections).every(v => v);
  const toggleAll = () => {
    const newValue = !allSelected;
    setSelectedSections(Object.keys(selectedSections).reduce((acc, key) => {
      acc[key] = newValue;
      return acc;
    }, {}));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Export Analysis Report</h3>
            <p className="text-sm text-slate-500 mt-1">Customize and download your career analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content Selection */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700">Select Report Sections:</p>
            <button
              onClick={toggleAll}
              className="text-xs font-medium text-violet-600 hover:text-violet-700"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-3">
            {[
              { id: 'summary', label: 'Job Summary', desc: 'Company, position, location' },
              { id: 'compensation', label: 'Compensation Data', desc: 'Salary, equity, adjustments' },
              { id: 'stability', label: 'Stability Metrics', desc: 'Risk score, runway, health' },
              { id: 'culture', label: 'Culture Analysis', desc: 'WLB, growth, stress levels' },
              { id: 'aiInsights', label: 'AI Insights', desc: 'Strategic recommendations' },
              { id: 'tunerSettings', label: 'Profile Settings', desc: 'Your preferences & values' },
            ].map(section => (
              <div
                key={section.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <div className="mt-0.5">
                  <Checkbox
                    checked={selectedSections[section.id]}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{section.label}</p>
                  <p className="text-xs text-slate-500">{section.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <Button
            onClick={generatePDF}
            className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            disabled={!Object.values(selectedSections).some(v => v)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={generateCSV}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            disabled={!Object.values(selectedSections).some(v => v)}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}