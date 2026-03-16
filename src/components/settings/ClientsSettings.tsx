import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Plus, Building, Search, Upload, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  paymentTerms: string;
}

interface ClientsSettingsProps {
  onBack: () => void;
}

const EMPTY_CLIENT: Omit<Client, 'id'> = {
  name: '',
  contact: '',
  email: '',
  phone: '',
  address: '',
  vatNumber: '',
  paymentTerms: 'NET 30',
};

export function ClientsSettings({ onBack }: ClientsSettingsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>(EMPTY_CLIENT);

  // Delete confirmation state
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  /**
   * Map a raw API client object to our local Client shape.
   * The API may return fields with different casing or naming conventions,
   * so we normalise them here.
   */
  const mapApiClient = (raw: any): Client => ({
    id: raw.id || raw._id || '',
    name: raw.name || raw.clientName || '',
    contact: raw.contact || raw.contactPerson || raw.contactName || '',
    email: raw.email || raw.contactEmail || '',
    phone: raw.phone || raw.contactPhone || raw.telephone || '',
    address: raw.address || '',
    vatNumber: raw.vatNumber || raw.vat || raw.vatNo || '',
    paymentTerms: raw.paymentTerms || raw.payment_terms || 'NET 30',
  });

  /**
   * Fetch all clients from the API
   */
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<any>(ENDPOINTS.CLIENTS);
      // Safely unwrap: apiClient.get already returns data.result,
      // but some endpoints may double-wrap or return an array directly.
      const data = response?.result || response;
      const list = Array.isArray(data) ? data : [];
      setClients(list.map(mapApiClient));
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /**
   * Create a new client
   */
  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.post(ENDPOINTS.CREATE_CLIENT, {
        name: formData.name,
        contact: formData.contact,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        vatNumber: formData.vatNumber,
        paymentTerms: formData.paymentTerms,
      });
      setShowModal(false);
      setFormData(EMPTY_CLIENT);
      // Refresh the list from the server
      await fetchClients();
    } catch (err: any) {
      console.error('Failed to create client:', err);
      setError(err.message || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Update an existing client
   */
  const handleUpdate = async () => {
    if (!editingClient) return;
    try {
      setSaving(true);
      setError(null);
      await apiClient.post(ENDPOINTS.UPDATE_CLIENT, {
        id: editingClient.id,
        name: formData.name,
        contact: formData.contact,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        vatNumber: formData.vatNumber,
        paymentTerms: formData.paymentTerms,
      });
      setShowModal(false);
      setEditingClient(null);
      setFormData(EMPTY_CLIENT);
      await fetchClients();
    } catch (err: any) {
      console.error('Failed to update client:', err);
      setError(err.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete a client
   */
  const handleDelete = async (clientId: string) => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.post(ENDPOINTS.DELETE_CLIENT, { id: clientId });
      setDeletingClientId(null);
      await fetchClients();
    } catch (err: any) {
      console.error('Failed to delete client:', err);
      setError(err.message || 'Failed to delete client');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle save from the modal (create or update)
   */
  const handleSave = () => {
    if (editingClient) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  /**
   * Open modal for creating a new client
   */
  const openCreateModal = () => {
    setEditingClient(null);
    setFormData(EMPTY_CLIENT);
    setShowModal(true);
  };

  /**
   * Open modal for editing an existing client
   */
  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contact: client.contact,
      email: client.email,
      phone: client.phone,
      address: client.address,
      vatNumber: client.vatNumber,
      paymentTerms: client.paymentTerms,
    });
    setShowModal(true);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">Clients</h1>
                <p className="text-[13px] text-[#6B7280]">Client database management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[13px] flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-8 py-8 pb-24">
        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin mb-3" />
            <p className="text-[14px] text-[#6B7280]">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Building className="w-12 h-12 text-[#D1D5DB] mb-3" />
            <p className="text-[15px] font-medium text-[#6B7280] mb-1">
              {searchQuery ? 'No clients match your search' : 'No clients yet'}
            </p>
            <p className="text-[13px] text-[#9CA3AF]">
              {searchQuery ? 'Try a different search term' : 'Click "Add Client" to create your first client'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-[#0066FF]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-medium text-[#1F2937] mb-1">{client.name}</h3>
                      <p className="text-[12px] text-[#6B7280] mb-3">{client.address}</p>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5">Contact Person</p>
                          <p className="text-[13px] text-[#1F2937]">{client.contact}</p>
                          <p className="text-[11px] text-[#6B7280]">{client.email}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5">VAT Number</p>
                          <p className="text-[13px] text-[#1F2937]">{client.vatNumber}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5">Payment Terms</p>
                          <p className="text-[13px] text-[#1F2937]">{client.paymentTerms}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <button
                      onClick={() => setDeletingClientId(client.id)}
                      className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[#F87171]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deletingClientId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-[16px] font-medium text-[#1F2937] mb-2">Delete Client</h3>
            <p className="text-[13px] text-[#6B7280] mb-6">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingClientId(null)}
                disabled={saving}
                className="px-4 py-2 border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-[13px] font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingClientId)}
                disabled={saving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-medium text-[#1F2937]">
                {editingClient ? 'Edit Client' : 'Add Client'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEditingClient(null); setFormData(EMPTY_CLIENT); }}
                className="p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. TechCorp Industries"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 555 0100"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Business Ave, New York, NY"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">VAT Number</label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
                    placeholder="US123456789"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent bg-white"
                  >
                    <option value="NET 15">NET 15</option>
                    <option value="NET 30">NET 30</option>
                    <option value="NET 45">NET 45</option>
                    <option value="NET 60">NET 60</option>
                    <option value="NET 90">NET 90</option>
                    <option value="Due on receipt">Due on receipt</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => { setShowModal(false); setEditingClient(null); setFormData(EMPTY_CLIENT); }}
                disabled={saving}
                className="px-4 py-2 border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-[13px] font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-[#93B5FF] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingClient ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
