'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeResumeMatch(resumeText, jobDescription) {
  try {
    const prompt = `
    Analyze how well this resume matches the job description and provide a detailed assessment:

    JOB DESCRIPTION:
    ${jobDescription}

    RESUME:
    ${resumeText}

    Please provide a JSON response with this exact structure:
    {
      "matchScore": <number 0-100>,
      "keyStrengths": ["strength1", "strength2", "strength3"],
      "missingSkills": ["skill1", "skill2", "skill3"],
      "experienceMatch": "Excellent|Good|Fair|Poor",
      "summary": "Brief 2-sentence summary of the candidate fit",
      "recommendations": ["recommendation1", "recommendation2"],
      "topSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "candidateName": "Extract candidate name from resume",
      "candidateEmail": "Extract email from resume",
      "yearsExperience": <estimated years of experience as number>
    }

    Focus on:
    - Technical skills alignment
    - Experience level match
    - Required qualifications
    - Cultural fit indicators
    - Extract candidate contact info
    `;

    // UPDATED: Enhanced OpenAI call with better error handling
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: "json_object" }, // Ensures JSON response
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI API');
    }

    // UPDATED: Better JSON parsing with error handling
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (jsonError) {
      console.error('JSON parsing failed. Raw response:', result);
      throw new Error(`Invalid JSON response from AI: ${jsonError.message}`);
    }

    // UPDATED: Validate required fields
    const requiredFields = ['matchScore', 'keyStrengths', 'missingSkills', 'experienceMatch', 'summary'];
    for (const field of requiredFields) {
      if (parsedResult[field] === undefined || parsedResult[field] === null) {
        console.warn(`Missing field in AI response: ${field}`);
        // Provide default values for missing fields
        if (field === 'matchScore') parsedResult[field] = 0;
        else if (Array.isArray(parsedResult[field])) parsedResult[field] = [];
        else parsedResult[field] = 'Not available';
      }
    }

    return parsedResult;

  } catch (error) {
    console.error('OpenAI analysis error:', error);
    
    // UPDATED: More specific error messages
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your billing.');
    } else if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    } else if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI API rate limit exceeded. Please wait and try again.');
    } else if (error.message.includes('JSON')) {
      throw new Error('AI returned invalid response format. Please try again.');
    } else {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}