import { NextResponse } from 'next/server';
import { getAllResumeFiles, extractTextFromFile } from '../../../(client)/lib/fileProcessor';

export async function GET() {
  try {
    console.log('=== Testing file processing (App Router) ===');
    
    // Test 1: Check if directory exists and list files
    let files;
    try {
      files = await getAllResumeFiles();
      console.log(`✅ Found ${files.length} resume files`);
    } catch (error) {
      console.error('❌ Failed to get files:', error);
      return NextResponse.json({
        error: 'Failed to read resume directory',
        details: error.message,
        suggestion: 'Check if public/uploads/resume folder exists and has proper permissions'
      }, { status: 500 });
    }

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No resume files found',
        files: [],
        suggestion: 'Add resume files (.pdf, .docx, .doc, .txt) to public/uploads/resume folder'
      });
    }

    // UPDATED: Enhanced file testing with PDF-specific diagnostics
    const testResults = [];
    const filesToTest = files.slice(0, Math.min(5, files.length)); // Test up to 5 files
    
    // Separate PDF files for special testing
    const pdfFiles = filesToTest.filter(f => f.toLowerCase().endsWith('.pdf'));
    const otherFiles = filesToTest.filter(f => !f.toLowerCase().endsWith('.pdf'));

    // Test non-PDF files first
    for (const filename of otherFiles) {
      try {
        console.log(`Testing file: ${filename}`);
        const text = await extractTextFromFile(filename);
        
        testResults.push({
          filename,
          success: true,
          textLength: text.length,
          preview: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          fileExtension: filename.split('.').pop().toLowerCase(),
          fileSize: text.length,
          fileType: 'document'
        });
        
        console.log(`✅ Successfully processed: ${filename} (${text.length} characters)`);
      } catch (error) {
        testResults.push({
          filename,
          success: false,
          error: error.message,
          fileExtension: filename.split('.').pop().toLowerCase(),
          fileType: 'document'
        });
        
        console.log(`❌ Failed to process: ${filename} - ${error.message}`);
      }
    }

    // UPDATED: Special PDF testing with enhanced diagnostics
    for (const filename of pdfFiles) {
      try {
        console.log(`Testing PDF file: ${filename}`);
        
        // First check if pdf-parse is available
        let hasPdfParse = false;
        try {
          require('pdf-parse');
          hasPdfParse = true;
        } catch {
          try {
            await import('pdf-parse');
            hasPdfParse = true;
          } catch {
            hasPdfParse = false;
          }
        }

        if (!hasPdfParse) {
          testResults.push({
            filename,
            success: false,
            error: 'pdf-parse package not installed',
            fileExtension: 'pdf',
            fileType: 'pdf',
            suggestion: 'Run: npm install pdf-parse'
          });
          continue;
        }

        const text = await extractTextFromFile(filename);
        
        testResults.push({
          filename,
          success: true,
          textLength: text.length,
          preview: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          fileExtension: 'pdf',
          fileSize: text.length,
          fileType: 'pdf',
          pdfSpecific: {
            hasText: text.length > 50,
            likelyScanned: text.length < 100,
            extractionMethod: 'pdf-parse'
          }
        });
        
        console.log(`✅ Successfully processed PDF: ${filename} (${text.length} characters)`);
      } catch (error) {
        testResults.push({
          filename,
          success: false,
          error: error.message,
          fileExtension: 'pdf',
          fileType: 'pdf',
          pdfSpecific: {
            possibleIssues: [
              error.message.includes('pdf-parse') ? 'Missing pdf-parse package' : null,
              error.message.includes('password') ? 'Password protected' : null,
              error.message.includes('corrupted') ? 'Corrupted file' : null,
              error.message.includes('no extractable text') ? 'Image-based PDF' : null
            ].filter(Boolean)
          }
        });
        
        console.log(`❌ Failed to process PDF: ${filename} - ${error.message}`);
      }
    }

    const successCount = testResults.filter(r => r.success).length;
    const failCount = testResults.filter(r => !r.success).length;
    const pdfCount = testResults.filter(r => r.fileType === 'pdf').length;
    const pdfSuccessCount = testResults.filter(r => r.fileType === 'pdf' && r.success).length;

    // UPDATED: Enhanced recommendations based on results
    const recommendations = [];
    if (failCount > 0) {
      recommendations.push('Check file permissions (chmod 644)');
      recommendations.push('Ensure files are not corrupted');
    }
    if (pdfCount > 0 && pdfSuccessCount < pdfCount) {
      recommendations.push('For PDFs: npm install pdf-parse');
      recommendations.push('Convert image-based PDFs to text format');
      recommendations.push('Remove password protection from PDFs');
    }
    if (failCount === 0) {
      recommendations.push('All tested files processed successfully!');
    }

    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      fileList: files,
      testResults,
      summary: {
        tested: testResults.length,
        successful: successCount,
        failed: failCount,
        successRate: `${Math.round((successCount / testResults.length) * 100)}%`,
        pdfFiles: pdfCount,
        pdfSuccessful: pdfSuccessCount,
        pdfSuccessRate: pdfCount > 0 ? `${Math.round((pdfSuccessCount / pdfCount) * 100)}%` : 'N/A'
      },
      recommendations
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      error: 'File test failed',
      details: error.message,
      suggestion: 'Check server logs for detailed error information'
    }, { status: 500 });
  }
}
