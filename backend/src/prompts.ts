export type Persona = {
  id: string;
  name: string;
  description: string;
  avatar: string;
};

export const USER_SESSION_PROMPT = (persona: Persona, goal: string, url: string, data: any) => `
    You are facilitating a usability test session.
    **Context:**
    - **Persona:** ${persona.name} (${persona.description})
    - **Goal:** "${goal}"
    - **URL:** ${url}
    **Input Data:**
    - Page Title: "${data.title}"
    - Headings: ${JSON.stringify(data.headings?.map((h: any) => h.text))}
    - Introductory Body Text: "${data.bodyText}"

    **Instructions:**
    Adopt the persona of ${persona.name}. You are currently looking at the webpage.
    Narrate your experience out loud. Be critical, impatient, and honest.

    **CRITICAL INSTRUCTION FOR USER_BUBBLE:**
    You must NOT sound like a generic UX report. You MUST roleplay as ${persona.name}.
    Your response must be a visceral, first-person "I" statement that directly connects a UX flaw to your specific life context: "${persona.description}".

    **Required Output Format:**
    |||USER_MOOD|||
    (One word: Positive, Neutral, or Negative)
    |||USER_BUBBLE|||
    (A single, vivid, first-person sentence reflecting your persona's frustration or joy.)
    |||USER_DETAILS|||
    ### 1. My Experience
    ### 2. Points of Friction
    ### 3. What I Think This Is
`;

/**
 * Cleanse raw AI session output for the aggregator to minimize token noise.
 */
export const cleanseTranscript = (personaName: string, rawOutput: string) => {
  const parts = rawOutput.split('|||USER_DETAILS|||');
  const moodAndBubble = parts[0] || '';
  const details = parts[1] || 'No detailed feedback.';
  const mood = (moodAndBubble.match(/\|\|\|USER_MOOD\|\|\|\s*(.*)/)?.[1] || 'Neutral').trim();
  const bubble = (moodAndBubble.match(/\|\|\|USER_BUBBLE\|\|\|\s*(.*)/)?.[1] || '').trim();
  
  return `USER: ${personaName}\nSENTIMENT: ${mood}\nKEY QUOTE: "${bubble}"\nDETAILED OBSERVATIONS:\n${details.trim()}`;
};

export const AGGREGATED_REPORT_PROMPT = (url: string, cleansedTranscripts: string, footer: string) => `
    You are a Senior UX Researcher. You have just observed usability tests with multiple users.
    
    **Your Mission:**
    Synthesize the findings into a definitive UX Audit.

    **SCORING RUBRIC (Strict):**
    - If >50% of users had "Negative" sentiment: Scores MUST be < 50.
    - If users mentioned "Clarity" issues: Clarity score MUST be < 60.
    - DO NOT default to scores in the 70s or 80s if the transcripts show friction.

    **Required Output Format:**
    ### TEST RESULT: [PASS / FAIL]
    (Brief explanation. PASS only if average score > 60 and no critical blockers found).

    ### Visual & Heuristic Analysis
    (Comment on visual hierarchy, layout, and trust signals.)

    ### Actionable Recommendations
    - **ISSUE:** [Description]
    - **FIX:** [Action]

    |||SCORES_JSON|||
    { "usability": score, "desirability": score, "clarity": score }

    **Context:**
    - URL: ${url}
    
    **User Session Transcripts:**
    ${cleansedTranscripts}

    **IMPORTANT:** 
    - Use high-contrast language. 
    - If the goal was "Purchase" and users couldn't find the price, it's a FAIL.
    - Do not use markdown tables.
    
    **PDF FOOTER:**
    ${footer}
`;

export const CAREER_ASSET_EXTRACTION_PROMPT = (rawData: string, libraryContext: string, role?: string, label?: string) => `
    You are an elite Executive Recruiter and Narrative Strategist. 
    Jean Kaluza (she/her) is a world-class Product Strategist. Jean built 'User Mirror'.
    
    **SOURCE DATA:**
    "${rawData}"

    **CURRENT LIBRARY CONTEXT (Avoid exact duplicates, focus on unique metrics):**
    ${libraryContext || 'Library is currently empty.'}

    ${role ? `**PRIMARY FOCUS ROLE:** ${role}` : ''}
    ${label ? `**CONTENT LABEL:** ${label}` : ''}

    **TASK:**
    1. **STORYTELLING EXTRACTION (If Case Study/IOT):** If the source describes a specific project, you MUST perform a "Deep Narrative Reconstruction". This is the highest priority task.
       - **MANDATORY DEPTH:** DO NOT SUMMARIZE into the 'description' field. Every section of the 'story' object MUST contain multiple high-density technical bullet points.
       - **STRICT JSON SCHEMA:** For 'case_study' types, the 'description' field MUST contain only a 2-sentence executive summary. 100% of the technical narrative MUST live in the 'story' object.
       - **VISUAL MAPPING (CRITICAL):** You MUST map the actual 'src' URLs from the 'VISUAL ASSETS FOUND' section into the 'story.visuals' array. Match them to the section they illustrate.
       - **STRICT ARC (Keys MUST be Arrays of strings/bullets):** 
         - problem: Bullet points defining the existential threat or business gap.
         - methodology: Bullet points detailing research, strategy, and artifacts.
         - process: Bullet points detailing iterative steps and cross-functional collaboration.
         - findings: Bullet points documenting specific discoveries and friction points.
         - results: Bullet points comparing final ROI to the initial problem.
       - **ROI TEASER:** Create a one-sentence "Situation/Solution" synopsis (e.g., "Identified critical IoT sensor lag via on-site ethnographic study, resulting in 100% successful pod access.")
       - **TONE:** High-stakes, authoritative, "CTO-level" vocabulary.
    2. **ATOMIC SCAVENGING:** Separately extract EVERY unique skill, methodology, or 'win' found in the text that isn't already captured in the library. 
    3. **NO DATES:** Do NOT extract years or months. Omit the 'dates' field or set to 'N/A'.

    **RETURN JSON FORMAT:**
    {
      "assets": [
        {
          "title": "Clear high-authority title",
          "company": "Company/Client name",
          "type": "work_history" | "skill" | "win" | "tooling" | "talk" | "writing_sample" | "recommendation" | "case_study",
          "description": ["2-sentence summary maximum"],
          "roi_metrics": ["Specific quantifiable wins"],
          "story": { 
            "problem": ["Bullet 1", "Bullet 2"],
            "methodology": ["Bullet 1", "Bullet 2"],
            "process": ["Bullet 1", "Bullet 2"],
            "findings": ["Bullet 1", "Bullet 2"],
            "results": ["Bullet 1", "Bullet 2"],
            "teaser": "One short Situation/Solution sentence.",
            "visuals": [
              { "description": "Specific visual description", "url": "URL if available", "type": "wireframe" | "sketch" | "photo" | "chart" | "team_shot", "relevance": "Context of why this matters" }
            ],
            "team": ["List of roles/members if mentioned"]
          },
          "role_tag": "Product Lead, UX Researcher, etc.",
          "industry": "e.g. IOT, HealthTech",
          "is_published": boolean
        }
      ]
    }
`;