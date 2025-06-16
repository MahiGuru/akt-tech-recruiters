'use server'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { analyzeResumeMatch } from '../../../(client)/lib/openai';
import { getAllResumeFiles, getRecruiterResumeFiles, extractTextFromResumeFile } from '../../../(client)/lib/fileProcessor';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const { jobDescription, minMatchScore = 0, recruiterOnly = false } = await request.json();

    if (!jobDescription || jobDescription.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Job description is required and must be at least 10 characters' 
      }, { status: 400 });
    }

    console.log('Starting resume analysis process...');
    console.log(`Recruiter-only mode: ${recruiterOnly}`);
    console.log(`Session user: ${session?.user?.name} (${session?.user?.role})`);

    // Get resume files based on the mode and user permissions
    let resumeFiles;
    try {
      if (recruiterOnly && session?.user?.role === 'RECRUITER') {
        // Get files only from the current recruiter's directory
        resumeFiles = await getRecruiterResumeFiles(session.user.id, session.user.name || 'Unknown');
        console.log(`Found ${resumeFiles.length} resume files in recruiter directory`);
      } else {
        // Get files from all directories (original behavior)
        resumeFiles = await getAllResumeFiles();
        console.log(`Found ${resumeFiles.length} resume files across all directories`);
      }
    } catch (fileError) {
      console.error('Error getting resume files:', fileError);
      return NextResponse.json({
        error: `Failed to read resume files: ${fileError.message}`,
        suggestion: 'Please check if public/uploads/resumes folder exists and contains resume files'
      }, { status: 500 });
    }
    
    if (resumeFiles.length === 0) {
      const suggestion = recruiterOnly 
        ? 'No resume files found in your recruiter directory. Please upload some resumes first.'
        : 'Please add resume files to public/uploads/resumes folder';
        
      return NextResponse.json({
        success: true,
        message: 'No resume files found',
        results: [],
        summary: {
          totalFiles: 0,
          totalProcessed: 0,
          successfulAnalysis: 0,
          errors: 0,
          resultsAboveMinScore: 0
        },
        suggestion,
        mode: recruiterOnly ? 'recruiter-only' : 'all-files'
      });
    }

    const results = [];
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process each resume file
    for (const resumeFileInfo of resumeFiles) {
      const displayName = resumeFileInfo.subdirectory 
        ? `${resumeFileInfo.subdirectory}/${resumeFileInfo.filename}`
        : resumeFileInfo.filename;
        
      try {
        console.log(`\n=== Processing file ${processedCount + 1}/${resumeFiles.length}: ${displayName} ===`);
        
        // Extract text from resume using the new method
        let resumeText;
        try {
          resumeText = await extractTextFromResumeFile(resumeFileInfo);
          console.log(`✅ Text extraction successful for ${displayName} (${resumeText.length} chars)`);
        } catch (extractError) {
          console.error(`❌ Text extraction failed for ${displayName}:`, extractError);
          results.push({
            filename: resumeFileInfo.filename,
            subdirectory: resumeFileInfo.subdirectory,
            displayName,
            error: `Text extraction failed: ${extractError.message}`,
            analysis: null,
            processedAt: new Date().toISOString(),
            errorType: 'text_extraction'
          });
          errorCount++;
          continue;
        }
        
        // Skip if text is too short after extraction
        if (!resumeText || resumeText.length < 50) {
          console.warn(`⚠️ Skipping ${displayName} - insufficient text content (${resumeText?.length || 0} chars)`);
          results.push({
            filename: resumeFileInfo.filename,
            subdirectory: resumeFileInfo.subdirectory,
            displayName,
            error: `Insufficient text content (${resumeText?.length || 0} characters)`,
            analysis: null,
            processedAt: new Date().toISOString(),
            errorType: 'insufficient_content'
          });
          errorCount++;
          continue;
        }
        
        // UPDATED: Enhanced AI analysis with better error handling
        let analysis;
        try {
          console.log(`🤖 Starting AI analysis for ${displayName}...`);
          
          // Check if OpenAI API key is available
          if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not found. Please add OPENAI_API_KEY to .env.local');
          }
          
          // Truncate very long text to avoid token limits
          const maxLength = 8000; // Safe limit for GPT-4
          const analysisText = resumeText.length > maxLength 
            ? resumeText.substring(0, maxLength) + '\n\n[Content truncated for analysis]'
            : resumeText;
          
          console.log(`Using ${analysisText.length} characters for AI analysis`);
          
          analysis = await analyzeResumeMatch(analysisText, jobDescription);
          console.log(`✅ AI analysis completed for ${displayName} - Score: ${analysis.matchScore}%`);
        } catch (aiError) {
          console.error(`❌ AI analysis failed for ${displayName}:`, aiError);
          
          // UPDATED: More specific AI error handling
          let aiErrorMessage = aiError.message;
          if (aiError.message.includes('API key')) {
            aiErrorMessage = 'OpenAI API key missing or invalid. Check .env.local file';
          } else if (aiError.message.includes('quota')) {
            aiErrorMessage = 'OpenAI API quota exceeded. Check your billing and usage';
          } else if (aiError.message.includes('rate')) {
            aiErrorMessage = 'OpenAI API rate limit exceeded. Please wait and try again';
          } else if (aiError.message.includes('JSON')) {
            aiErrorMessage = 'AI response parsing failed. The AI returned invalid data format';
          } else if (aiError.message.includes('model')) {
            aiErrorMessage = 'OpenAI model access denied. Check if you have GPT-4 access';
          }
          
          results.push({
            filename: resumeFileInfo.filename,
            subdirectory: resumeFileInfo.subdirectory,
            displayName,
            error: `AI analysis failed: ${aiErrorMessage}`,
            analysis: null,
            processedAt: new Date().toISOString(),
            errorType: 'ai_analysis',
            textLength: resumeText.length // Include this for debugging
          });
          errorCount++;
          continue;
        }
        
        // Only include results above minimum score
        if (analysis.matchScore >= minMatchScore) {
          results.push({
            filename: resumeFileInfo.filename,
            subdirectory: resumeFileInfo.subdirectory,
            displayName,
            fileSize: resumeFileInfo.size,
            analysis,
            processedAt: new Date().toISOString()
          });
          successCount++;
          console.log(`✅ Added to results: ${displayName} (${analysis.matchScore}% match)`);
        } else {
          console.log(`⚠️ Filtered out: ${displayName} (${analysis.matchScore}% < ${minMatchScore}%)`);
        }
        
        processedCount++;
        
        // Add delay to avoid OpenAI rate limiting
        if (processedCount < resumeFiles.length) {
          console.log('⏱️ Waiting 500ms before next file...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`❌ Unexpected error processing ${displayName}:`, error);
        results.push({
          filename: resumeFileInfo.filename,
          subdirectory: resumeFileInfo.subdirectory,
          displayName,
          error: `Unexpected error: ${error.message}`,
          analysis: null,
          processedAt: new Date().toISOString()
        });
        errorCount++;
      }
    }

    // Sort results by match score (highest first)
    const successResults = results.filter(r => r.analysis && !r.error);
    const errorResults = results.filter(r => r.error);
    
    successResults.sort((a, b) => {
      const scoreA = a.analysis?.matchScore || 0;
      const scoreB = b.analysis?.matchScore || 0;
      return scoreB - scoreA;
    });

    // Combine sorted success results with error results
    const finalResults = [...successResults, ...errorResults];

    console.log('\n=== Analysis Summary ===');
    console.log(`Total files found: ${resumeFiles.length}`);
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Results above min score: ${successResults.length}`);
    console.log(`Mode: ${recruiterOnly ? 'recruiter-only' : 'all-files'}`);

    return NextResponse.json({
      success: true,
      results: finalResults,
      summary: {
        totalFiles: resumeFiles.length,
        totalProcessed: processedCount,
        successfulAnalysis: successCount,
        errors: errorCount,
        resultsAboveMinScore: successResults.length
      },
      jobDescription: jobDescription.substring(0, 100) + '...',
      minMatchScore,
      mode: recruiterOnly ? 'recruiter-only' : 'all-files',
      recruiterInfo: recruiterOnly && session ? {
        id: session.user.id,
        name: session.user.name,
        directoryName: `${(session.user.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}-${session.user.id}`
      } : null
    });

  } catch (error) {
    console.error('❌ Analysis process failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Analysis failed',
      suggestion: 'Check server logs for detailed error information'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}