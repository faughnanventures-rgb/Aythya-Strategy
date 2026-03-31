/**
 * Document Upload API Route
 * 
 * Handles secure upload of user documents with:
 * - File validation
 * - Consent verification
 * - Supabase storage
 * - Text extraction for AI context
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DocumentType } from '@/types/goals';

// Type definitions for Supabase query results
interface ExistingDocument {
  id: string;
}

interface DocumentWithFilePath {
  file_path: string;
}

interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  custom_type_name: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  extracted_text: string | null;
  consent_given: boolean;
  consent_timestamp: string;
  expires_at: string;
  uploaded_at: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const DOCUMENT_TYPE_VALUES: DocumentType[] = ['resume', 'disc', 'strengthsfinder', 'pi', 'custom'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('document_type') as DocumentType | null;
    const customTypeName = formData.get('custom_type_name') as string | null;
    const consentGiven = formData.get('consent_given') === 'true';

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!documentType || !DOCUMENT_TYPE_VALUES.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    if (documentType === 'custom' && !customTypeName) {
      return NextResponse.json(
        { error: 'Custom document type requires a name' },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: 'Consent is required for document upload' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Please upload PDF, DOCX, PNG, or JPG.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check for existing document of same type
    let existingQuery = supabase
      .from('user_documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_type', documentType);
    
    if (customTypeName) {
      existingQuery = existingQuery.eq('custom_type_name', customTypeName);
    } else {
      existingQuery = existingQuery.is('custom_type_name', null);
    }
    
    const { data: existingData } = await existingQuery.single();
    const existing = existingData as ExistingDocument | null;

    if (existing) {
      // Delete existing document and file
      const { data: oldDocData } = await supabase
        .from('user_documents')
        .select('file_path')
        .eq('id', existing.id)
        .single();
      
      const oldDoc = oldDocData as DocumentWithFilePath | null;

      if (oldDoc?.file_path) {
        await supabase.storage
          .from('user-documents')
          .remove([oldDoc.file_path]);
      }

      await supabase
        .from('user_documents')
        .delete()
        .eq('id', existing.id);
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Extract text for AI context (for PDFs and DOCXs)
    let extractedText: string | null = null;
    
    if (file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        extractedText = await extractDocumentText(buffer, file.type);
      } catch (extractError) {
        console.error('Text extraction error:', extractError);
        // Don't fail the upload if extraction fails
      }
    }

    // Calculate expiry date (12 months from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12);

    // Save document metadata
    const { data: documentData, error: dbError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        document_type: documentType,
        custom_type_name: customTypeName,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        extracted_text: extractedText,
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('user-documents').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json(documentData);

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract text from PDF or DOCX for AI context
 */
async function extractDocumentText(buffer: Buffer, mimeType: string): Promise<string | null> {
  try {
    if (mimeType === 'application/pdf') {
      const pdfParse = await import('pdf-parse').catch(() => null);
      if (pdfParse) {
        const data = await pdfParse.default(buffer);
        return data.text.substring(0, 10000);
      }
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth').catch(() => null);
      if (mammoth) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value.substring(0, 10000);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Text extraction failed:', error);
    return null;
  }
}

// GET: List user's documents
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: documentsData, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    const documents = (documentsData || []) as UserDocument[];

    // Build context object for Claude
    const context: Record<string, string> = {};
    const custom: Record<string, string> = {};

    for (const doc of documents) {
      if (doc.extracted_text) {
        if (doc.document_type === 'custom' && doc.custom_type_name) {
          custom[doc.custom_type_name] = doc.extracted_text;
        } else {
          context[doc.document_type] = doc.extracted_text;
        }
      }
    }

    return NextResponse.json({
      documents,
      context: { ...context, custom },
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a document
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      );
    }

    // Get document to find file path
    const { data: documentData, error: fetchError } = await supabase
      .from('user_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    const document = documentData as DocumentWithFilePath | null;

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from storage
    await supabase.storage
      .from('user-documents')
      .remove([document.file_path]);

    // Delete database record
    const { error: deleteError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
