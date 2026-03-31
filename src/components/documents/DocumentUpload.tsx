'use client';

/**
 * Document Upload Component
 * 
 * Handles uploading of resumes, assessments, and custom documents
 * with PII warnings and consent management.
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, Check, X, Loader2, Shield } from 'lucide-react';
import type { DocumentType, UserDocument } from '@/types/goals';

interface DocumentUploadProps {
  onUploadComplete?: (document: UserDocument) => void;
  existingDocuments?: UserDocument[];
  showInOnboarding?: boolean;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { 
    value: 'resume', 
    label: 'Resume / CV', 
    description: 'Your professional background and experience' 
  },
  { 
    value: 'disc', 
    label: 'DISC Assessment', 
    description: 'Behavioral and communication style profile' 
  },
  { 
    value: 'strengthsfinder', 
    label: 'StrengthsFinder / CliftonStrengths', 
    description: 'Your top talents and strengths' 
  },
  { 
    value: 'pi', 
    label: 'Predictive Index (PI)', 
    description: 'Workplace behavioral assessment' 
  },
  { 
    value: 'custom', 
    label: 'Other Assessment', 
    description: '360 feedback, performance reviews, etc.' 
  },
];

const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/png': '.png',
  'image/jpeg': '.jpg,.jpeg',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({ 
  onUploadComplete, 
  existingDocuments = [],
  showInOnboarding = false 
}: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [customTypeName, setCustomTypeName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showPIIWarning, setShowPIIWarning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const hasExistingDocument = (type: DocumentType) => {
    return existingDocuments.some(doc => doc.document_type === type);
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    // Validate file type
    if (!Object.keys(ACCEPTED_TYPES).includes(selectedFile.type)) {
      setError('Please upload a PDF, DOCX, PNG, or JPG file.');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setShowPIIWarning(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedType || !file || !consentGiven) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', selectedType);
      formData.append('consent_given', 'true');
      if (selectedType === 'custom' && customTypeName) {
        formData.append('custom_type_name', customTypeName);
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const document = await response.json();
      onUploadComplete?.(document);

      // Reset form
      setSelectedType(null);
      setCustomTypeName('');
      setFile(null);
      setConsentGiven(false);
      setShowPIIWarning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-stone-800">
          {showInOnboarding ? 'Help Us Understand You Better' : 'Upload Documents'}
        </h3>
        <p className="text-sm text-stone-600 mt-1">
          {showInOnboarding 
            ? 'Optionally share documents to personalize your strategic plan. You can skip this and add them later.'
            : 'Upload assessments and documents to enrich your AI conversations.'}
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DOCUMENT_TYPES.map((type) => {
          const exists = hasExistingDocument(type.value);
          return (
            <button
              key={type.value}
              onClick={() => {
                setSelectedType(type.value);
                setError(null);
              }}
              disabled={exists}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedType === type.value
                  ? 'border-sage-500 bg-sage-50'
                  : exists
                  ? 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'
                  : 'border-stone-200 hover:border-sage-300 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-800">{type.label}</span>
                {exists && (
                  <span className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">
                    Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">{type.description}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Type Name Input */}
      {selectedType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Document Name
          </label>
          <input
            type="text"
            value={customTypeName}
            onChange={(e) => setCustomTypeName(e.target.value)}
            placeholder="e.g., 360 Feedback, Performance Review"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
          />
        </div>
      )}

      {/* File Drop Zone */}
      {selectedType && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-sage-500 bg-sage-50'
              : file
              ? 'border-sage-400 bg-sage-50'
              : 'border-stone-300 hover:border-sage-400'
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-sage-600" />
              <div className="text-left">
                <p className="font-medium text-stone-800">{file.name}</p>
                <p className="text-sm text-stone-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setConsentGiven(false);
                  setShowPIIWarning(false);
                }}
                className="ml-4 p-1 hover:bg-stone-200 rounded-full"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <p className="text-stone-600 mb-2">
                Drag and drop your file here, or
              </p>
              <label className="btn-secondary cursor-pointer inline-block">
                Browse Files
                <input
                  type="file"
                  accept={Object.values(ACCEPTED_TYPES).join(',')}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-stone-400 mt-3">
                PDF, DOCX, PNG, or JPG up to 10MB
              </p>
            </>
          )}
        </div>
      )}

      {/* PII Warning Modal */}
      {showPIIWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">Privacy Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                <strong>Please remove sensitive information</strong> before uploading:
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 ml-4 list-disc">
                <li>Social Security Number (SSN)</li>
                <li>Full home address (city/state is fine)</li>
                <li>Phone numbers</li>
                <li>Financial account numbers</li>
              </ul>
              <p className="text-sm text-amber-700 mt-3">
                Your documents will be processed by AI to personalize your strategic plan.
                They are encrypted and automatically deleted after 12 months.
              </p>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-3 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 w-4 h-4 text-sage-600 border-stone-300 rounded focus:ring-sage-500"
                />
                <span className="text-sm text-stone-700">
                  I confirm that I have removed sensitive personal information and consent to 
                  AI processing of this document to personalize my strategic planning experience.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {file && consentGiven && (
        <button
          onClick={handleUpload}
          disabled={isUploading || (selectedType === 'custom' && !customTypeName)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Upload Securely
            </>
          )}
        </button>
      )}

      {/* Skip Button for Onboarding */}
      {showInOnboarding && (
        <button
          onClick={() => {
            // Navigate to next step
            window.location.href = '/onboarding/next';
          }}
          className="w-full text-center text-stone-500 hover:text-stone-700 text-sm"
        >
          Skip for now — I'll add documents later
        </button>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Shield className="w-4 h-4" />
        <span>
          End-to-end encrypted • Auto-deleted after 12 months • You can delete anytime
        </span>
      </div>
    </div>
  );
}

export default DocumentUpload;
