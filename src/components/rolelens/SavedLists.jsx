import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Folder, Star, Target, Search, Trash2, Edit2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DEFAULT_CATEGORIES = [
  { id: 'dream', name: 'Dream Companies', icon: Star, color: 'from-amber-500 to-orange-500' },
  { id: 'target', name: 'Target Roles', icon: Target, color: 'from-violet-500 to-purple-500' },
  { id: 'research', name: 'Researching', icon: Search, color: 'from-teal-500 to-cyan-500' },
  { id: 'custom', name: 'Custom', icon: Folder, color: 'from-slate-500 to-slate-600' },
];

export default function SavedLists({ allJobs, onClose, onCompare, onSearch }) {
  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem('rolelens-saved-lists');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(list => {
        // Restore icon component from DEFAULT_CATEGORIES
        const defaultCat = DEFAULT_CATEGORIES.find(cat => cat.id === list.id);
        return {
          ...list,
          companies: list.companies || [],
          icon: defaultCat ? defaultCat.icon : Folder
        };
      });
    }
    return DEFAULT_CATEGORIES.map(cat => ({ ...cat, companies: [] }));
  });
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(null);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addCompanyInput, setAddCompanyInput] = useState('');

  useEffect(() => {
    localStorage.setItem('rolelens-saved-lists', JSON.stringify(lists));
  }, [lists]);

  const addCompanyToList = (listId, companyName) => {
    if (!companyName.trim()) return;
    
    // Create a new list entry with search button
    const newCompanyList = {
      id: `${listId}-${Date.now()}`,
      name: companyName,
      icon: Folder,
      color: 'from-slate-500 to-slate-600',
      companies: [],
      showSearchButton: true,
      parentListId: listId
    };
    
    setLists([...lists, newCompanyList]);
    setShowAddCompany(null);
    setAddCompanyInput('');
  };

  const removeCompanyFromList = (listId, companyId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return { ...list, companies: list.companies.filter(id => id !== companyId) };
      }
      return list;
    }));
  };

  const createNewList = (companyName) => {
    if (!companyName.trim()) return;
    
    // Add to Custom section
    setLists(lists.map(list => {
      if (list.id === 'custom') {
        return {
          ...list,
          companies: [...(list.companies || []), companyName]
        };
      }
      return list;
    }));
    setNewCompanyName('');
    setShowNewListInput(false);
  };
  
  const handleSearch = (companyName) => {
    if (onSearch) {
      onSearch(companyName);
      onClose();
    }
  };

  const saveListName = (listId) => {
    setLists(lists.map(list => list.id === listId ? { ...list, name: editName } : list));
    setEditingId(null);
  };

  const deleteList = (listId) => {
    if (DEFAULT_CATEGORIES.some(cat => cat.id === listId)) return;
    setLists(lists.filter(list => list.id !== listId));
  };

  const compareListCompanies = (listId) => {
    const list = lists.find(l => l.id === listId);
    if (list && list.companies.length > 0) {
      onCompare(list.companies);
      onClose();
    }
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
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Saved Company Lists</h2>
            <p className="text-sm text-slate-500 mt-1">Organize and track companies you're interested in</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex-1 overflow-auto p-6">
          {/* Add to List Button */}
          <div className="mb-4">
            {!showNewListInput ? (
              <Button
                onClick={() => setShowNewListInput(true)}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to List
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createNewList(newCompanyName)}
                  placeholder="Enter company name..."
                  className="flex-1"
                  autoFocus
                />
                <Button
                  onClick={() => createNewList(newCompanyName)}
                  disabled={!newCompanyName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    setShowNewListInput(false);
                    setNewCompanyName('');
                  }}
                  variant="outline"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lists.map(list => {
              const Icon = list.icon;
              const listCompanies = list.companies.map(id => allJobs[id]).filter(Boolean);
              
              return (
                <motion.div
                  key={list.id}
                  layout
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200"
                >
                  {/* List Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${list.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {editingId === list.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 w-40"
                            autoFocus
                          />
                          <button
                            onClick={() => saveListName(list.id)}
                            className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200"
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-slate-800">{list.name}</h3>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingId !== list.id && (
                        <button
                          onClick={() => {
                            setEditingId(list.id);
                            setEditName(list.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                      )}
                      {!DEFAULT_CATEGORIES.some(cat => cat.id === list.id) && (
                        <button
                          onClick={() => deleteList(list.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Companies */}
                  <div className="space-y-2 mb-3">
                    {list.id === 'custom' ? (
                      // Custom list - show company names as text
                      list.companies?.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-4 text-center">No companies added yet</p>
                      ) : (
                        list.companies.map((companyName, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200"
                          >
                            <p className="font-semibold text-slate-800 text-sm">{companyName}</p>
                            <button
                              onClick={() => {
                                setLists(lists.map(l => 
                                  l.id === 'custom' 
                                    ? { ...l, companies: l.companies.filter((_, i) => i !== idx) }
                                    : l
                                ));
                              }}
                              className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                            </button>
                          </div>
                        ))
                      )
                    ) : listCompanies.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-4 text-center">No companies added yet</p>
                    ) : (
                      listCompanies.map(job => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <img src={job.meta.logo} alt="" className="w-8 h-8 rounded-lg" />
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{job.meta.company}</p>
                              <p className="text-xs text-slate-500">{job.meta.title}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeCompanyFromList(list.id, job.id)}
                            className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {list.id === 'custom' && (
                      <button
                        onClick={() => setShowAddCompany(showAddCompany === list.id ? null : list.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-white border-2 border-slate-200 hover:border-violet-300 transition-colors text-sm font-medium text-slate-700"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Company
                      </button>
                    )}
                  </div>

                  {/* Add Company Input */}
                  <AnimatePresence>
                    {showAddCompany === list.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="flex gap-2">
                          <Input
                            value={addCompanyInput}
                            onChange={(e) => setAddCompanyInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCompanyToList(list.id, addCompanyInput)}
                            placeholder="Enter company name..."
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            onClick={() => addCompanyToList(list.id, addCompanyInput)}
                            disabled={!addCompanyInput.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setShowAddCompany(null);
                              setAddCompanyInput('');
                            }}
                            variant="outline"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}