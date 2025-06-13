// 'use server'

// import { NextResponse } from 'next/server';
// import { analyzeResumeMatch } from '../../../(client)/lib/openai';

// export async function POST() {
//   try {
//     console.log('=== Testing OpenAI API Connection ===');
    
//     // Test sample data
//     const testResume = `John Doe
// Software Engineer
// Email: john@example.com
// Phone: (555) 123-4567

// Experience:
// - 5 years of JavaScript development
// - React and Node.js experience
// - Full-stack web development
// - Agile methodologies

// Skills: JavaScript, React, Node.js, HTML, CSS, Git, AWS`;

//     const testJobDescription = `We are looking for a Senior Software Engineer with:
// - 3+ years of JavaScript experience
// - React and Node.js skills
// - Full-stack development experience
// - Team collaboration skills`;

//     // Check environment variables first
//     if (!process.env.OPENAI_API_KEY) {
//       return NextResponse.json({
//         success: false,
//         error: 'OpenAI API key not found',
//         details: 'OPENAI_API_KEY is missing from environment variables',
//         suggestions: [
//           'Add OPENAI_API_KEY to your .env.local file',
//           'Restart your development server after adding the key',
//           'Verify the API key is valid in OpenAI dashboard'
//         ]
//       }, { status: 400 });
//     }

//     console.log('✅ OpenAI API key found in environment');
//     console.log('🤖 Testing AI analysis with sample data...');

//     // Test the AI analysis
//     const analysis = await analyzeResumeMatch(testResume, testJobDescription);
    
//     console.log('✅ OpenAI API test successful');
//     console.log(`Analysis result: ${analysis.matchScore}% match`);

//     return NextResponse.json({
//       success: true,
//       message: 'OpenAI API is working correctly',
//       testResult: {
//         matchScore: analysis.matchScore,
//         candidateName: analysis.candidateName,
//         extractedEmail: analysis.candidateEmail,
//         keyStrengths: analysis.keyStrengths?.slice(0, 3) || [],
//         topSkills: analysis.topSkills?.slice(0, 5) || []
//       },
//       apiStatus: 'Connected and functional'
//     });

//   } catch (error) {
//     console.error('❌ OpenAI API test failed:', error);
    
//     let errorType = 'unknown';
//     let suggestions = ['Check server logs for detailed error information'];
    
//     if (error.message.includes('API key')) {
//       errorType = 'authentication';
//       suggestions = [
//         'Verify your OpenAI API key is correct',
//         'Check if the API key has sufficient permissions',
//         'Ensure the API key is not expired'
//       ];
//     } else if (error.message.includes('quota') || error.message.includes('billing')) {
//       errorType = 'quota';
//       suggestions = [
//         'Check your OpenAI billing dashboard',
//         'Add payment method if needed',
//         'Upgrade your OpenAI plan if quota exceeded'
//       ];
//     } else if (error.message.includes('rate')) {
//       errorType = 'rate_limit';
//       suggestions = [
//         'Wait a few minutes before trying again',
//         'Reduce the frequency of API calls',
//         'Upgrade to a higher tier plan for better rate limits'
//       ];
//     } else if (error.message.includes('model')) {
//       errorType = 'model_access';
//       suggestions = [
//         'Verify you have access to GPT-4',
//         'Try using GPT-3.5-turbo instead',
//         'Check your OpenAI account tier'
//       ];
//     } else if (error.message.includes('network') || error.message.includes('fetch')) {
//       errorType = 'network';
//       suggestions = [
//         'Check your internet connection',
//         'Verify firewall is not blocking OpenAI API',
//         'Try again in a few minutes'
//       ];
//     }

//     return NextResponse.json({
//       success: false,
//       error: 'OpenAI API test failed',
//       errorType,
//       details: error.message,
//       suggestions
//     }, { status: 500 });
//   }
// }