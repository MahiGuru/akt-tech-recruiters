import mammoth from 'mammoth';
import { readFile, readdir, access, stat } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

export async function extractTextFromFile(filename, subdirectory = null) {
  // Build the file path - handle both old flat structure and new subdirectory structure
  let filePath;
  if (subdirectory) {
    filePath = path.join(process.cwd(), 'public/uploads/resumes', subdirectory, filename);
  } else {
    // Try the flat structure first, then check subdirectories if not found
    filePath = path.join(process.cwd(), 'public/uploads/resumes', filename);
  }
  
  try {
    console.log(`Starting text extraction for: ${filename}`);
    console.log(`Full file path: ${filePath}`);
    
    // Check if file exists at the specified path
    let fileExists = false;
    try {
      await access(filePath, constants.F_OK | constants.R_OK);
      fileExists = true;
      console.log(`File ${filename} exists and is readable at ${filePath}`);
    } catch (accessError) {
      // If subdirectory wasn't specified, try to find the file in subdirectories
      if (!subdirectory) {
        console.log(`File not found in root directory, searching subdirectories...`);
        const foundPath = await findFileInSubdirectories(filename);
        if (foundPath) {
          filePath = foundPath;
          fileExists = true;
          console.log(`Found file in subdirectory: ${filePath}`);
        }
      }
      
      if (!fileExists) {
        console.error(`File access error for ${filename}:`, accessError);
        throw new Error(`File ${filename} is not accessible or doesn't exist`);
      }
    }

    // Get file stats
    const fileStats = await stat(filePath);
    console.log(`File ${filename} size: ${fileStats.size} bytes`);
    
    if (fileStats.size === 0) {
      throw new Error(`File ${filename} is empty`);
    }

    if (fileStats.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error(`File ${filename} is too large (${fileStats.size} bytes). Maximum size is 50MB`);
    }

    // Read file buffer
    const fileBuffer = await readFile(filePath);
    console.log(`Successfully read ${fileBuffer.length} bytes from ${filename}`);
    
    const fileExtension = path.extname(filename).toLowerCase();
    let extractedText = '';

    switch (fileExtension) {
      case '.txt':
        try {
          extractedText = fileBuffer.toString('utf-8');
          console.log(`Extracted ${extractedText.length} characters from TXT file`);
        } catch (txtError) {
          console.error(`TXT parsing error for ${filename}:`, txtError);
          throw new Error(`Failed to parse TXT file: ${txtError.message}`);
        }
        break;
        
      case '.docx':
        try {
          console.log(`Processing DOCX file: ${filename}`);
          const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = docxResult.value;
          console.log(`Extracted ${extractedText.length} characters from DOCX file`);
          
          if (docxResult.messages && docxResult.messages.length > 0) {
            console.warn(`DOCX parsing warnings for ${filename}:`, docxResult.messages);
          }
        } catch (docxError) {
          console.error(`DOCX parsing error for ${filename}:`, docxError);
          throw new Error(`Failed to parse DOCX file: ${docxError.message}`);
        }
        break;
        
      case '.doc':
        try {
          console.log(`Processing legacy DOC file: ${filename}`);
          // Legacy DOC files are more complex - try basic extraction first
          extractedText = fileBuffer.toString('utf-8');
          // Clean up binary artifacts
          extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
          extractedText = extractedText.replace(/\s+/g, ' ').trim();
          console.log(`Extracted ${extractedText.length} characters from DOC file (basic extraction)`);
          
          if (extractedText.length < 10) {
            throw new Error('DOC file appears to be unreadable or corrupted');
          }
        } catch (docError) {
          console.error(`DOC parsing error for ${filename}:`, docError);
          throw new Error(`Failed to parse DOC file: ${docError.message}`);
        }
        break;
        
      case '.pdf':
        try {
          console.log(`Processing PDF file: ${filename}`);
          
          // UPDATED: Enhanced PDF parsing with better error handling
          let pdfParse;
          try {
            // Try multiple import methods for pdf-parse
            try {
              pdfParse = require('pdf-parse');
            } catch (requireError) {
              console.log('Trying dynamic import for pdf-parse...');
              const pdfModule = await import('pdf-parse');
              pdfParse = pdfModule.default || pdfModule;
            }
          } catch (importError) {
            console.error('pdf-parse not available:', importError);
            throw new Error('PDF parsing requires pdf-parse package. Install with: npm install pdf-parse');
          }
          
          // UPDATED: Enhanced PDF parsing options for better compatibility
          const pdfOptions = {
            // Normalize whitespace and handle encoding issues
            normalizeWhitespace: true,
            // Don't throw errors on minor PDF issues
            max: 0, // Parse all pages
            version: 'v1.10.100' // Use stable version
          };
          
          // UPDATED: Try parsing with different strategies
          let pdfResult;
          try {
            // Strategy 1: Standard parsing
            pdfResult = await pdfParse(fileBuffer, pdfOptions);
          } catch (parseError1) {
            console.warn(`Standard PDF parsing failed for ${filename}, trying alternative method:`, parseError1.message);
            
            try {
              // Strategy 2: Basic parsing without options
              pdfResult = await pdfParse(fileBuffer);
            } catch (parseError2) {
              console.warn(`Basic PDF parsing failed for ${filename}, trying buffer conversion:`, parseError2.message);
              
              try {
                // Strategy 3: Ensure buffer is properly formatted
                const cleanBuffer = Buffer.from(fileBuffer);
                pdfResult = await pdfParse(cleanBuffer);
              } catch (parseError3) {
                console.error(`All PDF parsing strategies failed for ${filename}:`, parseError3.message);
                throw new Error(`PDF file appears to be corrupted or password-protected: ${parseError3.message}`);
              }
            }
          }
          
          extractedText = pdfResult.text || '';
          
          // UPDATED: Better text validation and cleaning
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('PDF file contains no extractable text (might be image-based or scanned)');
          }
          
          // Clean up common PDF parsing artifacts
          extractedText = extractedText
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .trim();
          
          console.log(`✅ PDF parsing successful for ${filename}`);
          console.log(`Extracted ${extractedText.length} characters from PDF file`);
          if (pdfResult.numpages) {
            console.log(`PDF info - Pages: ${pdfResult.numpages}`);
          }
          
        } catch (pdfError) {
          console.error(`❌ PDF parsing error for ${filename}:`, pdfError);
          
          // UPDATED: More specific error messages for different PDF issues
          if (pdfError.message.includes('pdf-parse')) {
            throw new Error('PDF parsing requires pdf-parse package. Install with: npm install pdf-parse');
          } else if (pdfError.message.includes('password')) {
            throw new Error('PDF file is password-protected and cannot be read');
          } else if (pdfError.message.includes('corrupted')) {
            throw new Error('PDF file appears to be corrupted or invalid');
          } else if (pdfError.message.includes('no extractable text')) {
            throw new Error('PDF contains no extractable text (likely image-based). Consider using OCR or converting to text format');
          } else {
            throw new Error(`PDF parsing failed: ${pdfError.message}. Try converting PDF to DOCX or TXT format`);
          }
        }
        break;
        
      default:
        throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: .pdf, .docx, .doc, .txt`);
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(`No text content found in ${filename}`);
    }

    if (extractedText.trim().length < 10) {
      console.warn(`Very short text extracted from ${filename}: "${extractedText.trim()}"`);
      throw new Error(`Insufficient text content in ${filename} (${extractedText.trim().length} characters)`);
    }

    console.log(`Successfully extracted ${extractedText.length} characters from ${filename}`);
    return extractedText.trim();

  } catch (error) {
    console.error(`Text extraction failed for ${filename}:`, error);
    
    // Provide more specific error messages
    if (error.code === 'ENOENT') {
      throw new Error(`File ${filename} not found in uploads/resumes folder`);
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied reading file ${filename}`);
    } else if (error.code === 'EISDIR') {
      throw new Error(`${filename} is a directory, not a file`);
    } else {
      throw new Error(`Failed to extract text from ${filename}: ${error.message}`);
    }
  }
}

// Helper function to find a file in subdirectories
async function findFileInSubdirectories(filename) {
  const resumeDir = path.join(process.cwd(), 'public/uploads/resumes');
  
  try {
    const items = await readdir(resumeDir);
    
    for (const item of items) {
      const itemPath = path.join(resumeDir, item);
      const stats = await stat(itemPath);
      
      if (stats.isDirectory()) {
        // Check if the file exists in this subdirectory
        const possibleFilePath = path.join(itemPath, filename);
        try {
          await access(possibleFilePath, constants.F_OK | constants.R_OK);
          return possibleFilePath;
        } catch {
          // File not in this subdirectory, continue searching
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error searching subdirectories:', error);
  }
  
  return null;
}

export async function getAllResumeFiles(recruiterSubdirectory = null) {
  try {
    const resumeDir = path.join(process.cwd(), 'public/uploads/resumes');
    console.log(`Scanning resume directory: ${resumeDir}`);
    
    // Check if directory exists
    try {
      await access(resumeDir, constants.F_OK | constants.R_OK);
      console.log('Resume directory exists and is readable');
    } catch (accessError) {
      console.error('Resume directory access error:', accessError);
      throw new Error(`Resume directory not found or not accessible: ${resumeDir}`);
    }

    const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const resumeFiles = [];
    
    if (recruiterSubdirectory) {
      // Get files from specific recruiter subdirectory
      const subdirPath = path.join(resumeDir, recruiterSubdirectory);
      try {
        await access(subdirPath, constants.F_OK | constants.R_OK);
        const files = await readdir(subdirPath);
        
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            try {
              const filePath = path.join(subdirPath, file);
              const fileStats = await stat(filePath);
              
              if (fileStats.isFile()) {
                resumeFiles.push({
                  filename: file,
                  subdirectory: recruiterSubdirectory,
                  fullPath: filePath,
                  size: fileStats.size
                });
                console.log(`Added resume file: ${recruiterSubdirectory}/${file} (${fileStats.size} bytes)`);
              }
            } catch (statError) {
              console.warn(`Could not stat file ${file}:`, statError);
            }
          }
        }
      } catch (subdirError) {
        console.error(`Error accessing recruiter subdirectory ${recruiterSubdirectory}:`, subdirError);
        throw new Error(`Recruiter directory not found: ${recruiterSubdirectory}`);
      }
    } else {
      // Get files from all locations (root and subdirectories)
      const items = await readdir(resumeDir);
      
      for (const item of items) {
        const itemPath = path.join(resumeDir, item);
        const itemStats = await stat(itemPath);
        
        if (itemStats.isFile()) {
          // File in root directory
          const ext = path.extname(item).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            resumeFiles.push({
              filename: item,
              subdirectory: null,
              fullPath: itemPath,
              size: itemStats.size
            });
            console.log(`Added resume file from root: ${item} (${itemStats.size} bytes)`);
          }
        } else if (itemStats.isDirectory()) {
          // Check subdirectory for files
          try {
            const subFiles = await readdir(itemPath);
            
            for (const subFile of subFiles) {
              const ext = path.extname(subFile).toLowerCase();
              if (supportedExtensions.includes(ext)) {
                try {
                  const subFilePath = path.join(itemPath, subFile);
                  const subFileStats = await stat(subFilePath);
                  
                  if (subFileStats.isFile()) {
                    resumeFiles.push({
                      filename: subFile,
                      subdirectory: item,
                      fullPath: subFilePath,
                      size: subFileStats.size
                    });
                    console.log(`Added resume file from ${item}: ${subFile} (${subFileStats.size} bytes)`);
                  }
                } catch (subStatError) {
                  console.warn(`Could not stat subdirectory file ${subFile}:`, subStatError);
                }
              }
            }
          } catch (subdirError) {
            console.warn(`Could not read subdirectory ${item}:`, subdirError);
          }
        }
      }
    }

    console.log(`Found ${resumeFiles.length} valid resume files`);
    return resumeFiles;

  } catch (error) {
    console.error('Error reading resume directory:', error);
    
    if (error.code === 'ENOENT') {
      throw new Error('Resume directory not found. Please create public/uploads/resumes folder and add resume files.');
    } else if (error.code === 'EACCES') {
      throw new Error('Permission denied accessing resume directory. Please check folder permissions.');
    } else {
      throw new Error(`Failed to read resume directory: ${error.message}`);
    }
  }
}

// New function specifically for recruiter resume analysis
export async function getRecruiterResumeFiles(recruiterId, recruiterName) {
  const cleanName = recruiterName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const subdirectory = `${cleanName}-${recruiterId}`;
  return await getAllResumeFiles(subdirectory);
}

// Function to extract text from a resume with full path information
export async function extractTextFromResumeFile(resumeFileInfo) {
  if (resumeFileInfo.subdirectory) {
    return await extractTextFromFile(resumeFileInfo.filename, resumeFileInfo.subdirectory);
  } else {
    return await extractTextFromFile(resumeFileInfo.filename);
  }
}