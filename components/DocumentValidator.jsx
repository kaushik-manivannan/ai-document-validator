'use client';

import { useState } from 'react';
import { Upload, CheckCircle, FileWarning, AlertCircle, Download, FileText } from 'lucide-react';

export default function EnhancedDocumentValidator() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [autoDetectedType, setAutoDetectedType] = useState(null);
  const [formFields, setFormFields] = useState({
    organizationName: '',
    ownerName: '',
    fein: ''
  });

  const documentTypes =  [
    { value: 'tax-clearance-online', label: 'Tax Clearance Certificate (Online Generated)' },
    { value: 'tax-clearance-manual', label: 'Tax Clearance Certificate (Manually Generated)' },
    { value: 'cert-alternative-name', label: 'Certificate of Alternative Name' },
    { value: 'cert-trade-name', label: 'Certificate of Trade Name' },
    { value: 'cert-formation', label: 'Certificate of Formation' },
    { value: 'cert-good-standing-long', label: 'Certificate of Good Standing (Long Form)' },
    { value: 'cert-good-standing-short', label: 'Certificate of Good Standing (Short Form)' },
    { value: 'operating-agreement', label: 'Operating Agreement' },
    { value: 'cert-incorporation', label: 'Certificate of Incorporation' },
    { value: 'irs-determination', label: 'IRS Determination Letter' },
    { value: 'bylaws', label: 'By-laws' },
    { value: 'cert-authority', label: 'Certificate of Authority' }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setValidationResult(null);
      setError(null);
      setAutoDetectedType(null);
      setDocumentType('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateDocument = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    
    try {
      // Create form data for the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Only append documentType if it was manually selected
      if (documentType) {
        formData.append('documentType', documentType);
      }
      
      // Add form fields to the request
      Object.entries(formFields).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Call your API route that will interface with Azure AI
      const response = await fetch('/api/validate-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // If document type was auto-detected, update the UI
      if (result.documentInfo && result.documentInfo.detectedType) {
        setAutoDetectedType(result.documentInfo.detectedType);
        setDocumentType(result.documentInfo.detectedType);
      }
      
      setValidationResult(result);
    } catch (err) {
      console.error('Error validating document:', err);
      setError(err.message || 'Failed to validate document');
    } finally {
      setIsUploading(false);
    }
  };

  // Function to determine which form fields to show based on document type
  const getFormFieldsForDocumentType = () => {
    switch(documentType) {
      case 'tax-clearance-online':
      case 'tax-clearance-manual':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={formFields.organizationName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter organization name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">FEIN (Federal Employer Identification Number)</label>
              <input
                type="text"
                name="fein"
                value={formFields.fein}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                placeholder="Enter FEIN"
              />
              <p className="text-xs text-gray-500 mt-1">This will be used to verify the last 3 digits on the tax clearance</p>
            </div>
          </>
        );
      case 'operating-agreement':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={formFields.organizationName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                placeholder="Enter organization name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Names (comma separated)</label>
              <input
                type="text"
                name="ownerName"
                value={formFields.ownerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                placeholder="Enter member names"
              />
              <p className="text-xs text-gray-500 mt-1">We'll check if these members are listed in the document</p>
            </div>
          </>
        );
      case 'cert-formation':
      case 'cert-good-standing-long':
      case 'cert-good-standing-short':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              name="organizationName"
              value={formFields.organizationName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter organization name"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">NJ EASE - Entrepreneurial Application Screening Engine</h2>
        <p className="text-sm text-gray-600">Upload a document to verify its authenticity and contents</p>
      </div>
      
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
        <div className="flex items-center gap-2">
          <select
            value={documentType}
            onChange={(e) => {
              setDocumentType(e.target.value);
              setValidationResult(null);
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Auto-detect (Recommended)</option>
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {autoDetectedType && (
          <p className="text-sm text-green-600 mt-1">
            Auto-detected as: {documentTypes.find(t => t.value === autoDetectedType)?.label}
          </p>
        )}
      </div>
      
      {getFormFieldsForDocumentType()}
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document</label>
        <div 
          className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
            ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {file ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-600 text-center">{fileName}</p>
              <p className="text-xs text-gray-500 mt-1">Click to change file</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload your document</p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOCX, DOC, JPG, PNG</p>
            </>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            file 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          onClick={validateDocument}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Validating...
            </div>
          ) : "Validate Document"}
        </button>
      </div>
      
      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-md w-full">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      {validationResult && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md w-full">
          <h3 className="font-semibold text-gray-800 mb-3">Validation Results</h3>
          
          <div className="flex items-center mb-3">
            <div className={`w-3 h-3 rounded-full mr-2 ${validationResult.missingElements && validationResult.missingElements.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className={`font-medium ${validationResult.missingElements && validationResult.missingElements.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {validationResult.missingElements && validationResult.missingElements.length > 0 ? 'Validation Failed' : 'Validation Passed'}
            </span>
          </div>
          
          {validationResult.missingElements && validationResult.missingElements.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-2">The following issues were found:</p>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                {validationResult.missingElements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="text-sm text-green-600 mb-2">All validation checks passed successfully!</p>
              
              {validationResult.documentInfo && (
                <div className="mt-3 text-xs text-gray-600">
                  <p>Document Information:</p>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    {validationResult.documentInfo.pageCount && (
                      <li>Pages: {validationResult.documentInfo.pageCount}</li>
                    )}
                    {validationResult.documentInfo.wordCount && (
                      <li>Words: {validationResult.documentInfo.wordCount}</li>
                    )}
                    {validationResult.documentInfo.containsHandwriting !== undefined && (
                      <li>Contains handwriting: {validationResult.documentInfo.containsHandwriting ? 'Yes' : 'No'}</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
          
          {validationResult.suggestedActions && validationResult.suggestedActions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Suggested Actions:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                {validationResult.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}