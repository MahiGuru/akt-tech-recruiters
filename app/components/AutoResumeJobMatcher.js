import { useState } from 'react';

const AutoResumeJobMatcher = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [minMatchScore, setMinMatchScore] = useState(40);
  const [testingFiles, setTestingFiles] = useState(false);
  const [fileTestResults, setFileTestResults] = useState(null);

  const testFileReading = async () => {
    setTestingFiles(true);
    setFileTestResults(null);

    try {
      const response = await fetch('/api/resumes/test-files');
      const data = await response.json();
      setFileTestResults(data);
    } catch (error) {
      console.error('File test error:', error);
      setFileTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setTestingFiles(false);
    }
  };

  const findMatchingProfiles = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }

    if (jobDescription.trim().length < 10) {
      alert('Job description must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/resumes/analyze-all-resumes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          minMatchScore: minMatchScore
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data);
      } else {
        alert(data.error || 'Analysis failed');
        console.error('Analysis error:', data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getExperienceColor = (experience) => {
    switch (experience) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadResults = () => {
    if (!results || !results.results) return;

    const csvContent = [
      ['Rank', 'Candidate Name', 'Email', 'Match Score', 'Experience', 'Years Experience', 'Summary', 'Top Skills', 'Filename'].join(','),
      ...results.results
        .filter(r => r.analysis && !r.error)
        .map((result, index) => [
          index + 1,
          result.analysis.candidateName || 'N/A',
          result.analysis.candidateEmail || 'N/A',
          result.analysis.matchScore,
          result.analysis.experienceMatch || 'N/A',
          result.analysis.yearsExperience || 'N/A',
          `"${result.analysis.summary?.replace(/"/g, '""') || 'N/A'}"`,
          `"${result.analysis.topSkills?.join('; ') || 'N/A'}"`,
          result.filename
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-matches-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          AI Resume Matcher With JOB Description
        </h2>
        <p className="text-gray-600">
          Enter job description and automatically find the best matching resumes from AtBench.
        </p>
      </div>

      {/* UPDATED: API Diagnostic Section */}
      {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-yellow-900">API & Environment Check</h3>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                // Test OpenAI API specifically
                try {
                  const response = await fetch('/api/resumes/test-openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const data = await response.json();
                  
                  if (data.success) {
                    alert(`✅ OpenAI API Working!\nTest Score: ${data.testResult.matchScore}%\nCandidate: ${data.testResult.candidateName}`);
                  } else {
                    alert(`❌ OpenAI API Failed: ${data.error}\n\nSuggestions:\n${data.suggestions?.join('\n') || 'Check API configuration'}`);
                  }
                } catch (error) {
                  alert(`❌ OpenAI Test Failed: ${error.message}`);
                }
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              🤖 Test OpenAI API
            </button>
            <button
              onClick={async () => {
                // Quick API diagnostic
                try {
                  const response = await fetch('/api/resumes/analyze-all-resumes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      jobDescription: 'Test job description for API check',
                      minMatchScore: 0
                    })
                  });
                  const data = await response.json();
                  
                  if (data.success && data.summary) {
                    alert(`✅ API Working! Found ${data.summary.totalFiles} files, ${data.summary.errors} errors`);
                  } else {
                    alert(`⚠️ API Response: ${data.error || 'Unknown error'}`);
                  }
                } catch (error) {
                  alert(`❌ API Test Failed: ${error.message}`);
                }
              }}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              🧪 Quick API Test
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-gray-800">Environment Setup</div>
            <div className="text-gray-600 mt-1">
              • Check .env.local has OPENAI_API_KEY<br/>
              • Verify pdf-parse is installed<br/>
              • Ensure uploads folder exists
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-gray-800">Common Issues</div>
            <div className="text-gray-600 mt-1">
              • Text extraction works but AI fails = API issue<br/>
              • All files fail = Environment issue<br/>
              • Only PDFs fail = Missing pdf-parse
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-gray-800">Quick Fixes</div>
            <div className="text-gray-600 mt-1">
              • npm install pdf-parse<br/>
              • Check OpenAI billing dashboard<br/>
              • Restart development server
            </div>
          </div>
        </div>
      </div> */}

      {/* File Test Section */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-blue-900">File System Test</h3>
          <button
            onClick={testFileReading}
            disabled={testingFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testingFiles ? 'Testing...' : '🔍 Test File Reading'}
          </button>
        </div>
        
        {fileTestResults && (
          <div className="mt-3">
            {fileTestResults.success ? (
              <div className="space-y-3">
                <div className="text-green-800">
                  ✅ Found {fileTestResults.totalFiles} resume files
                </div>
                
                {fileTestResults.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <div className="text-lg font-bold text-blue-600">{fileTestResults.summary.tested}</div>
                      <div className="text-sm text-gray-600">Tested</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-lg font-bold text-green-600">{fileTestResults.summary.successful}</div>
                      <div className="text-sm text-gray-600">Successful</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-lg font-bold text-red-600">{fileTestResults.summary.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-lg font-bold text-purple-600">{fileTestResults.summary.successRate}</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                  </div>
                )}
                
                {fileTestResults.testResults && fileTestResults.testResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-blue-800">Individual Test Results:</div>
                    {fileTestResults.testResults.map((test, index) => (
                      <div key={index} className={`text-sm p-3 rounded border ${test.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{test.success ? '✅' : '❌'}</span>
                          <span className="font-medium">{test.filename}</span>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            {test.fileExtension?.toUpperCase()}
                          </span>
                          {test.fileType === 'pdf' && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                              PDF
                            </span>
                          )}
                        </div>
                        
                        {test.success ? (
                          <div className="space-y-1">
                            <div className="text-xs">
                              ✅ {test.textLength} characters extracted
                            </div>
                            {test.pdfSpecific && (
                              <div className="text-xs space-y-1">
                                {test.pdfSpecific.likelyScanned && (
                                  <div className="text-yellow-600">
                                    ⚠️ Low text content - might be scanned/image-based
                                  </div>
                                )}
                                {test.pdfSpecific.hasText && (
                                  <div className="text-green-600">
                                    ✅ Good text extraction from PDF
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs">{test.error}</div> 
                            {test.pdfSpecific && test.pdfSpecific.possibleIssues && (
                              <div className="text-xs mt-2">
                                <div className="font-medium">Possible PDF issues:</div>
                                <ul className="list-disc list-inside ml-2 space-y-1">
                                  {test.pdfSpecific.possibleIssues.map((issue, i) => (
                                    <li key={i}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {test.suggestion && (
                              <div className="text-xs mt-1 font-medium">
                                💡 {test.suggestion}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                // UPDATED: Enhanced summary with PDF-specific stats
                {fileTestResults.summary && fileTestResults.summary.pdfFiles > 0 && (
                  <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-200">
                    <div className="text-sm font-medium text-blue-800 mb-2">PDF Processing Summary:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                      <div>PDF Files Found: {fileTestResults.summary.pdfFiles}</div>
                      <div>PDF Success Rate: {fileTestResults.summary.pdfSuccessRate}</div>
                    </div>
                    {fileTestResults.summary.pdfSuccessRate !== '100%' && (
                      <div className="text-xs text-blue-600 mt-2">
                        💡 For PDF issues: ensure pdf-parse is installed, files aren't password-protected, and consider converting image-based PDFs to text
                      </div>
                    )}
                  </div>
                )}
                
                {fileTestResults.recommendations && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-blue-800 mb-1">Recommendations:</div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {fileTestResults.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-800">
                ❌ {fileTestResults.error}
                {fileTestResults.suggestion && (
                  <div className="text-sm mt-1">💡 {fileTestResults.suggestion}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div> */}

      {/* Job Description Input */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Job Description</h3>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Enter the complete job description including required skills, experience, qualifications, and responsibilities..."
          className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={8}
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {jobDescription.length} characters
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Min Match Score:</label>
              <select
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Show All (0%)</option>
                <option value={20}>20%+</option>
                <option value={40}>40%+</option>
                <option value={60}>60%+</option>
                <option value={80}>80%+</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Find Matches Button */}
      <div className="text-center">
        <button
          onClick={findMatchingProfiles}
          disabled={loading || !jobDescription.trim()}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
            loading || !jobDescription.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Analyzing All Resumes...
            </div>
          ) : (
            '🎯 Find Matching Profiles'
          )}
        </button>
      </div>

      {/* Loading Progress */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center text-blue-800">
            <p className="font-medium">Processing resumes from uploads folder...</p>
            <p className="text-sm mt-1">This may take a few minutes depending on the number of files</p>
            <p className="text-xs mt-2 text-blue-600">Check browser console for detailed progress logs</p>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
            {results.results.filter(r => r.analysis && !r.error).length > 0 && (
              <button
                onClick={downloadResults}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📥 Download CSV
              </button>
            )}
          </div>
          
          {/* Summary Stats */}
          {results.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.summary.totalFiles}</div>
                <div className="text-sm text-blue-800">Total Files</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.summary.successfulAnalysis}</div>
                <div className="text-sm text-green-800">Successful</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{results.summary.resultsAboveMinScore}</div>
                <div className="text-sm text-purple-800">Above Min Score</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {results.results.filter(r => r.analysis && r.analysis.matchScore >= 70).length}
                </div>
                <div className="text-sm text-yellow-800">High Matches (70%+)</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.summary.errors}</div>
                <div className="text-sm text-red-800">Errors</div>
              </div>
            </div>
          )}

          {results.results.filter(r => r.analysis && !r.error).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-lg font-medium mb-2">No Matching Profiles Found</h4>
              <p>Try lowering the minimum match score or check if there are resume files in the uploads folder.</p>
              <button
                onClick={testFileReading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test File Reading
              </button>
            </div>
          )}
        </div>
      )}

      {/* Individual Results */}
      {results && results.results.filter(r => r.analysis && !r.error).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Top Matching Candidates ({results.results.filter(r => r.analysis && !r.error).length})
          </h3>
          
          {results.results
            .filter(r => r.analysis && !r.error)
            .map((result, index) => (
              <div key={result.filename} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                {/* Header with Rank and Score */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-lg">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {result.analysis.candidateName || 'Name not found'}
                      </h4>
                      <p className="text-gray-600">{result.analysis.candidateEmail || 'Email not found'}</p>
                      <p className="text-sm text-gray-500">File: {result.filename}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full border-2 font-bold text-lg ${
                    getScoreColor(result.analysis.matchScore)
                  }`}>
                    {result.analysis.matchScore}% Match
                  </div>
                </div>

                {/* Summary and Experience */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                  <div className="lg:col-span-2">
                    <h5 className="font-semibold text-gray-800 mb-2">Summary</h5>
                    <p className="text-gray-700 text-sm">{result.analysis.summary}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Experience</h5>
                    <div className="space-y-1">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        getExperienceColor(result.analysis.experienceMatch)
                      }`}>
                        {result.analysis.experienceMatch}
                      </span>
                      {result.analysis.yearsExperience && (
                        <p className="text-sm text-gray-600">
                          ~{result.analysis.yearsExperience} years
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Contact</h5>
                    <div className="space-y-1">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                        📧 Contact
                      </button>
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                        💼 View Resume
                      </button>
                    </div>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Key Strengths */}
                  <div>
                    <h5 className="font-semibold text-green-700 mb-3">✅ Key Strengths</h5>
                    <ul className="space-y-1">
                      {result.analysis.keyStrengths.slice(0, 4).map((strength, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <h5 className="font-semibold text-red-700 mb-3">❌ Missing Skills</h5>
                    <ul className="space-y-1">
                      {result.analysis.missingSkills.slice(0, 4).map((skill, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Top Skills */}
                  <div>
                    <h5 className="font-semibold text-blue-700 mb-3">🏆 Top Skills</h5>
                    <div className="flex flex-wrap gap-1">
                      {result.analysis.topSkills.slice(0, 6).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {result.analysis.recommendations.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h5 className="font-semibold text-purple-700 mb-2">💡 Recommendations</h5>
                    <div className="text-sm text-gray-700">
                      {result.analysis.recommendations.slice(0, 2).map((rec, i) => (
                        <p key={i} className="mb-1">• {rec}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Error Results */}
      {results && results.results.filter(r => r.error).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-3">
            Files with Processing Errors ({results.results.filter(r => r.error).length})
          </h4>
          
          {/* UPDATED: Categorize errors by type */}
          {(() => {
            const textErrors = results.results.filter(r => r.errorType === 'text_extraction');
            const aiErrors = results.results.filter(r => r.errorType === 'ai_analysis');
            const otherErrors = results.results.filter(r => r.error && !r.errorType);
            
            return (
              <div className="space-y-4">
                {/* Text Extraction Errors */}
                {textErrors.length > 0 && (
                  <div className="bg-white rounded p-3 border border-red-200">
                    <h5 className="font-medium text-red-700 mb-2">
                      📄 Text Extraction Errors ({textErrors.length})
                    </h5>
                    <div className="space-y-2">
                      {textErrors.map((result, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-red-700">{result.filename}</p>
                          <p className="text-red-600">{result.error}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-red-600">
                      💡 Solutions: Install pdf-parse for PDFs, check file permissions, ensure files aren't corrupted
                    </div>
                  </div>
                )}
                
                {/* AI Analysis Errors */}
                {aiErrors.length > 0 && (
                  <div className="bg-white rounded p-3 border border-orange-200">
                    <h5 className="font-medium text-orange-700 mb-2">
                      🤖 AI Analysis Errors ({aiErrors.length})
                    </h5>
                    <div className="space-y-2">
                      {aiErrors.map((result, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-orange-700">{result.filename}</p>
                          <p className="text-orange-600">{result.error}</p>
                          {result.textLength && (
                            <p className="text-xs text-green-600">
                              ✅ Text extracted successfully ({result.textLength} characters)
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-orange-600">
                      💡 Solutions: Check OpenAI API key, verify billing/quota, ensure internet connection
                    </div>
                  </div>
                )}
                
                {/* Other Errors */}
                {otherErrors.length > 0 && (
                  <div className="bg-white rounded p-3 border border-red-200">
                    <h5 className="font-medium text-red-700 mb-2">
                      ⚠️ Other Errors ({otherErrors.length})
                    </h5>
                    <div className="space-y-2">
                      {otherErrors.map((result, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-red-700">{result.filename}</p>
                          <p className="text-red-600">{result.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* UPDATED: Enhanced diagnostic section */}
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-2">🔧 Diagnostic Help</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>PDF Issues:</strong> Run <code className="bg-white px-1 rounded">npm install pdf-parse</code></div>
              <div>• <strong>API Issues:</strong> Check <code className="bg-white px-1 rounded">.env.local</code> has <code className="bg-white px-1 rounded">OPENAI_API_KEY</code></div>
              <div>• <strong>Quota Issues:</strong> Check OpenAI billing dashboard</div>
              <div>• <strong>File Issues:</strong> Try converting to TXT or DOCX format</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoResumeJobMatcher;