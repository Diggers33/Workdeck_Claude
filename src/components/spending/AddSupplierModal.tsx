import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

interface AddSupplierModalProps {
  onClose: () => void;
  onSupplierAdded: (supplier: Supplier) => void;
}

interface Supplier {
  companyName: string;
  supplierType: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  vatNumber: string;
  notes: string;
}

export function AddSupplierModal({ onClose, onSupplierAdded }: AddSupplierModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [supplierType, setSupplierType] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showTaxInfo, setShowTaxInfo] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    const supplier: Supplier = {
      companyName,
      supplierType,
      contactName,
      phone,
      email,
      address,
      city,
      zipCode,
      country,
      vatNumber,
      notes
    };

    onSupplierAdded(supplier);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ padding: '20px' }}>
      <div 
        className="bg-white rounded-xl overflow-hidden"
        style={{ width: '100%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b" style={{ borderColor: '#E5E7EB', padding: '20px 24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            Add New Supplier
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto" style={{ padding: '24px', flex: 1 }}>
          {/* Company Name */}
          <div className="mb-5">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              COMPANY NAME <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setError('');
              }}
              placeholder="e.g., TechSupplies Ltd"
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                fontSize: '14px',
                borderColor: error ? '#DC2626' : '#E5E7EB',
                height: '44px'
              }}
            />
            {error && (
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                {error}
              </div>
            )}
          </div>

          {/* Supplier Type */}
          <div className="mb-5">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              SUPPLIER TYPE
            </label>
            <select
              value={supplierType}
              onChange={(e) => setSupplierType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
            >
              <option value="">Select type...</option>
              <option value="Vendor">Vendor</option>
              <option value="Contractor">Contractor</option>
              <option value="Service Provider">Service Provider</option>
            </select>
          </div>

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '24px 0' }} />

          {/* Contact Details Section */}
          <button
            onClick={() => setShowContactDetails(!showContactDetails)}
            className="flex items-center gap-2 w-full mb-4 hover:opacity-70 transition-opacity"
            style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}
          >
            {showContactDetails ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Contact Details (optional)
          </button>

          {showContactDetails && (
            <div className="mb-5 pl-6">
              {/* Contact Name and Phone */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    CONTACT NAME
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    PHONE
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 612 345 678"
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@techsupplies.com"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                />
              </div>
            </div>
          )}

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '24px 0' }} />

          {/* Address Section */}
          <button
            onClick={() => setShowAddress(!showAddress)}
            className="flex items-center gap-2 w-full mb-4 hover:opacity-70 transition-opacity"
            style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}
          >
            {showAddress ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Address (optional)
          </button>

          {showAddress && (
            <div className="mb-5 pl-6">
              {/* Address */}
              <div className="mb-4">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  ADDRESS
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Tech Street"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                />
              </div>

              {/* City and Zip Code */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    CITY
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Barcelona"
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    ZIP CODE
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="08001"
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  COUNTRY
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                >
                  <option value="">Select country...</option>
                  <option value="Spain">Spain</option>
                  <option value="Ireland">Ireland</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '24px 0' }} />

          {/* Tax Information Section */}
          <button
            onClick={() => setShowTaxInfo(!showTaxInfo)}
            className="flex items-center gap-2 w-full mb-4 hover:opacity-70 transition-opacity"
            style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}
          >
            {showTaxInfo ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Tax Information (optional)
          </button>

          {showTaxInfo && (
            <div className="mb-5 pl-6">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                VAT NUMBER
              </label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="ES12345678A"
                className="w-full px-3 py-2 border rounded-lg"
                style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
              />
            </div>
          )}

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '24px 0' }} />

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              NOTES
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this supplier..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              style={{ fontSize: '14px', borderColor: '#E5E7EB' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t" style={{ borderColor: '#E5E7EB', padding: '20px 24px' }}>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-all"
            style={{ borderColor: '#E5E7EB', fontSize: '14px', fontWeight: 500, color: '#374151' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500 }}
          >
            Add Supplier
          </button>
        </div>
      </div>
    </div>
  );
}
