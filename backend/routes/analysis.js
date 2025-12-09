import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth.js';
import UserAnalysis from '../models/UserAnalysis.js';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Analyze user based on emails - Requires authentication
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array is required' });
    }

    // Format emails for analysis
    const emailText = emails.map((email, index) => {
      return `Email ${index + 1}:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Content: ${email.snippet || email.body}
---`;
    }).join('\n\n');

    const prompt = `Analyze the following emails to extract insights about the user. Extract information about:

1. Personal Interests & Hobbies: What does the user like? What are their hobbies or interests mentioned?
2. Education: Where does the user go to school or university? Any educational institutions mentioned?
3. Work Information: 
   - Company name
   - Job title/role
   - Supervisor or manager name and email (if mentioned)
4. Relationships:
   - Best friend name and email (most frequently contacted person who seems like a close friend)
   - Close contacts (friends, colleagues, family members) with their names, emails, and relationship type
5. Location: City, state, country if mentioned
6. Frequent Topics: What topics or subjects are frequently discussed?
7. Communication Style: How does the user communicate? (formal, casual, professional, etc.)

Return the analysis as a JSON object with the following structure:
{
  "interests": ["interest1", "interest2"],
  "hobbies": ["hobby1", "hobby2"],
  "school": "school name or null",
  "university": "university name or null",
  "company": "company name or null",
  "jobTitle": "job title or null",
  "supervisor": {"name": "name or null", "email": "email or null"},
  "bestFriend": {"name": "name or null", "email": "email or null"},
  "closeContacts": [{"name": "name", "email": "email", "relationship": "friend/colleague/family"}],
  "location": {"city": "city or null", "state": "state or null", "country": "country or null"},
  "frequentTopics": [{"topic": "topic name", "frequency": number}],
  "communicationStyle": "style description or null",
  "insights": "A brief paragraph summarizing key insights about this person"
}

Only include information that is clearly mentioned or can be reasonably inferred. Use null for fields where information is not available. Be accurate and don't make assumptions.

Emails:
${emailText}

Analysis (JSON only):`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing emails to extract personal insights. You MUST return ONLY valid JSON, no additional text, no explanations, no markdown formatting. The response must be a valid JSON object that can be parsed directly.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more accurate extraction
        max_tokens: 2000
        // Removed response_format as gpt-4 doesn't support it
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      if (openaiError.response) {
        console.error('OpenAI response:', openaiError.response.data);
      }
      return res.status(500).json({ 
        error: 'Failed to analyze emails with AI', 
        details: openaiError.message || 'OpenAI API error'
      });
    }

    // Check if we got a valid response
    if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('Invalid OpenAI response structure:', completion);
      return res.status(500).json({ 
        error: 'Failed to analyze emails', 
        details: 'Invalid response from AI service' 
      });
    }

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return res.status(500).json({ 
        error: 'Failed to analyze emails', 
        details: 'AI returned empty response' 
      });
    }

    let analysisData;
    try {
      // Try to extract JSON if there's any extra text
      let jsonContent = responseContent.trim();
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '').trim();
      }
      
      analysisData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing analysis JSON:', parseError);
      console.error('Raw response:', responseContent);
      return res.status(500).json({ 
        error: 'Failed to parse analysis results', 
        details: `AI returned invalid JSON format: ${parseError.message}` 
      });
    }

    // Clean and structure the data to match the schema
    const updateData = {
      interests: Array.isArray(analysisData.interests) ? analysisData.interests : [],
      hobbies: Array.isArray(analysisData.hobbies) ? analysisData.hobbies : [],
      school: analysisData.school || null,
      university: analysisData.university || null,
      company: analysisData.company || null,
      jobTitle: analysisData.jobTitle || null,
      supervisor: (analysisData.supervisor && analysisData.supervisor.name) 
        ? { name: analysisData.supervisor.name, email: analysisData.supervisor.email || null }
        : null,
      bestFriend: (analysisData.bestFriend && analysisData.bestFriend.name)
        ? { name: analysisData.bestFriend.name, email: analysisData.bestFriend.email || null }
        : null,
      closeContacts: Array.isArray(analysisData.closeContacts) 
        ? analysisData.closeContacts.map(contact => ({
            name: contact.name || '',
            email: contact.email || null,
            relationship: contact.relationship || 'unknown'
          }))
        : [],
      location: (analysisData.location && (analysisData.location.city || analysisData.location.country))
        ? {
            city: analysisData.location.city || null,
            state: analysisData.location.state || null,
            country: analysisData.location.country || null
          }
        : null,
      frequentTopics: Array.isArray(analysisData.frequentTopics)
        ? analysisData.frequentTopics.map(topic => ({
            topic: topic.topic || topic,
            frequency: typeof topic.frequency === 'number' ? topic.frequency : 1
          }))
        : [],
      communicationStyle: analysisData.communicationStyle || null,
      insights: analysisData.insights || '',
      analyzedEmailCount: emails.length,
      lastAnalyzed: new Date()
    };

    // Update or create user analysis
    const analysis = await UserAnalysis.findOneAndUpdate(
      { userId: req.userId },
      { $set: updateData },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({ 
      message: 'Analysis completed successfully',
      analysis: {
        interests: analysis.interests || [],
        hobbies: analysis.hobbies || [],
        school: analysis.school,
        university: analysis.university,
        company: analysis.company,
        jobTitle: analysis.jobTitle,
        supervisor: analysis.supervisor,
        bestFriend: analysis.bestFriend,
        closeContacts: analysis.closeContacts || [],
        location: analysis.location,
        frequentTopics: analysis.frequentTopics || [],
        communicationStyle: analysis.communicationStyle,
        insights: analysis.insights,
        analyzedEmailCount: analysis.analyzedEmailCount,
        lastAnalyzed: analysis.lastAnalyzed
      }
    });
  } catch (error) {
    console.error('Error analyzing emails:', error);
    res.status(500).json({ 
      error: 'Failed to analyze emails', 
      details: error.message 
    });
  }
});

// Get user analysis - Requires authentication
router.get('/profile', authenticate, async (req, res) => {
  try {
    const analysis = await UserAnalysis.findOne({ userId: req.userId });

    if (!analysis) {
      return res.json({ 
        message: 'No analysis available',
        analysis: null 
      });
    }

    res.json({ 
      analysis: {
        interests: analysis.interests || [],
        hobbies: analysis.hobbies || [],
        school: analysis.school,
        university: analysis.university,
        company: analysis.company,
        jobTitle: analysis.jobTitle,
        supervisor: analysis.supervisor,
        bestFriend: analysis.bestFriend,
        closeContacts: analysis.closeContacts || [],
        location: analysis.location,
        frequentTopics: analysis.frequentTopics || [],
        communicationStyle: analysis.communicationStyle,
        insights: analysis.insights,
        analyzedEmailCount: analysis.analyzedEmailCount,
        lastAnalyzed: analysis.lastAnalyzed
      }
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analysis', 
      details: error.message 
    });
  }
});

// Delete user analysis - Requires authentication
router.delete('/profile', authenticate, async (req, res) => {
  try {
    await UserAnalysis.findOneAndDelete({ userId: req.userId });
    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ 
      error: 'Failed to delete analysis', 
      details: error.message 
    });
  }
});

export default router;

