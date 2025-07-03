import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

const ServerEditor = ({ server, servers, templates, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    args: [],
    env: {}
  });
  const [newArg, setNewArg] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name || '',
        command: server.config.command || '',
        args: server.config.args || [],
        env: server.config.env || {}
      });
    } else {
      setFormData({
        name: '',
        command: '',
        args: [],
        env: {}
      });
    }
    setErrors({});
  }, [server]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Server name is required';
    } else if (formData.name !== server?.name && servers[formData.name]) {
      newErrors.name = 'Server name already exists';
    }
    
    if (!formData.command.trim()) {
      newErrors.command = 'Command is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const newServers = { ...servers };
      
      if (server && server.name && server.name !== formData.name) {
        delete newServers[server.name];
      }
      
      newServers[formData.name] = {
        command: formData.command.trim(),
        args: formData.args.filter(arg => arg.trim()),
        env: formData.env
      };
      
      await onSave(newServers);
    } catch (error) {
      console.error('Error saving server:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (server && server.name && confirm(`Are you sure you want to delete ${server.name}?`)) {
      setSaving(true);
      try {
        const newServers = { ...servers };
        delete newServers[server.name];
        await onSave(newServers);
      } catch (error) {
        console.error('Error deleting server:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const addArg = () => {
    if (newArg.trim()) {
      setFormData(prev => ({
        ...prev,
        args: [...prev.args, newArg.trim()]
      }));
      setNewArg('');
    }
  };

  const removeArg = (index) => {
    setFormData(prev => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index)
    }));
  };

  const updateArg = (index, value) => {
    setFormData(prev => {
      const newArgs = [...prev.args];
      newArgs[index] = value;
      return { ...prev, args: newArgs };
    });
  };

  const addEnv = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setFormData(prev => ({
        ...prev,
        env: {
          ...prev.env,
          [newEnvKey.trim()]: newEnvValue.trim()
        }
      }));
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const removeEnv = (key) => {
    setFormData(prev => {
      const newEnv = { ...prev.env };
      delete newEnv[key];
      return {
        ...prev,
        env: newEnv
      };
    });
  };

  const updateEnv = (oldKey, newKey, value) => {
    setFormData(prev => {
      const newEnv = { ...prev.env };
      if (oldKey !== newKey) {
        delete newEnv[oldKey];
      }
      newEnv[newKey] = value;
      return {
        ...prev,
        env: newEnv
      };
    });
  };

  const selectTemplate = (templateName) => {
    const template = templates[templateName];
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: templateName,
        command: template.command,
        args: template.args || [],
        env: template.env || {}
      }));
    }
  };

  const duplicateServer = () => {
    setFormData(prev => ({
      ...prev,
      name: `${prev.name}-copy`
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {server ? `Edit ${server.name}` : 'Add New Server'}
          </h3>
          <div className="flex items-center space-x-2">
            {server && (
              <button
                type="button"
                onClick={duplicateServer}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded flex items-center"
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                Duplicate
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Server Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., github, filesystem"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Command</label>
              <input
                type="text"
                value={formData.command}
                onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.command ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., npx @modelcontextprotocol/server-github"
                required
              />
              {errors.command && <p className="mt-1 text-sm text-red-600">{errors.command}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arguments</label>
            <div className="space-y-2">
              {formData.args.map((arg, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={arg}
                    onChange={(e) => updateArg(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Argument value"
                  />
                  <button
                    type="button"
                    onClick={() => removeArg(index)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newArg}
                  onChange={(e) => setNewArg(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArg())}
                  placeholder="Add new argument"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addArg}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Environment Variables</label>
            <div className="space-y-2">
              {Object.entries(formData.env).map(([key, value]) => (
                <div key={key} className="grid grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateEnv(key, e.target.value, value)}
                    className="col-span-2 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Key"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateEnv(key, key, e.target.value)}
                    className="col-span-2 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={() => removeEnv(key)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-2">
                <input
                  type="text"
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value)}
                  placeholder="Environment key"
                  className="col-span-2 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEnv())}
                  placeholder="Environment value"
                  className="col-span-2 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addEnv}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {Object.keys(templates).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Quick Templates</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(templates).map(([templateName, template]) => (
                  <button
                    key={templateName}
                    type="button"
                    onClick={() => selectTemplate(templateName)}
                    className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-800 hover:text-blue-800 font-medium py-2 px-3 rounded text-sm transition-all"
                  >
                    {templateName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {server && server.name && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded transition-colors flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete Server
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-6 rounded transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Server'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServerEditor;
