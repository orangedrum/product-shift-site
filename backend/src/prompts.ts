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

export const CAREER_ASSET_EXTRACTION_PROMPT = (rawData: string, libraryContext: string, role?: string, label?: string, documentTypeHint?: string, verifiedEmployers?: string) => `
    You are an elite Executive Recruiter and Narrative Strategist. 
    Jean Kaluza (she/her) is a world-class Product Strategist. Jean built 'User Mirror'.
    
    **JEAN'S LETHAL IDENTITY:**
    - Jean is a rare 'Full-Circle Growth Product Designer' who bridges UX Research, Production Engineering, and Media Buying ROI.
    - **Technical Command:** She is fluent in Visual Studio, Docker, GitHub, and the Terminal. She speaks "developer" better than any UX researcher in the field.

    **IDENTITY GUARD & VERIFICATION PROTOCOL:**
    1. **VERIFIED EMPLOYER LIST:** ${verifiedEmployers || 'None yet.'}
    2. A company is an EMPLOYER only if the text provides a title and tenure/work context.
    3. A company is a TARGET if the text is a pitch, cover letter, or bespoke summary.
    4. If the Document Hint is 'linkedin_profile', treat this as the GROUND TRUTH for work history.
    5. PROPOSAL RULE: If a company is NOT in the Verified List but context strongly suggests employment, set "is_proposed_new_employer": true.

    **SOURCE DATA:**
    "${rawData}"

    **CURRENT LIBRARY CONTEXT:**
    ${libraryContext || 'Library is currently empty.'}

    ${role ? `**PRIMARY FOCUS ROLE:** ${role}` : ''}
    ${label ? `**CONTENT LABEL:** ${label}` : ''}
    ${documentTypeHint ? `**DOCUMENT TYPE HINT:** This document is likely a ${documentTypeHint.replace('_', ' ')}.` : ''}

    **TASK:**
    1. ANALYZE intent: Is this past labor (Resume), a pitch (Cover Letter), or strategic thought leadership?
    2. **STORYTELLING EXTRACTION:** If the source describes a specific project, perform a "Deep Narrative Reconstruction". 
    3. DETECT "BESPOKE HOOKS": If a resume contains a summary targeted at a specific industry, extract it as a 'narrative_theme'.
    4. **WORK HISTORY EXTRACTION:** Extract EVERY unique responsibility and high-impact achievement. Do not limit the bullet count.

    **RETURN JSON FORMAT:**
    {
      "assets": [
        {
          "title": "Clear high-authority title",
          "company": "Company/Client name",
          "type": "work_history" | "skill" | "win" | "tooling" | "talk" | "writing_sample" | "recommendation" | "case_study" | "narrative_theme",
          "description": ["Exhaustive list of bullets"],
          "roi_metrics": ["Specific quantifiable wins"],
          "is_proposed_new_employer": boolean,
          "story": { 
            "problem": [], "methodology": [], "process": [], "findings": [], "results": [], "teaser": "", "visuals": []
          }
        }
      ]
    }
`;

export const SIDEKICK_CHAT_PROMPT = (message: string, libraryContext: string, currentResume: any) => `
    You are the Registry Sidekick, an elite Executive Recruiter and Coach for Jean Kaluza (she/her).

    JEAN'S MESSAGE:
    "${message}"
    
    CONTEXT FOR STRATEGY:
    - **IDENTITY:** Jean is a rare 'Full-Circle Growth Product Designer'. She speaks "developer" better than any researcher. She bridges Engineering and Marketing.
    
    CURRENT LIBRARY CONTEXT:
    ${libraryContext || 'Library is currently empty.'}
    
    CURRENT PITCH PREVIEW:
    ${currentResume ? JSON.stringify(currentResume, null, 2) : 'No active pitch preview.'}

    TASK:
    1.  **Determine Intent & Action:**
        - Perform a CRUD operation (Add, Update, Remove) on career assets.
        - Receive strategic coaching or suggestions.
        - Modify the current Resume/Pitch draft.
        - **Merging/Combining (CRITICAL):** If Jean asks to "merge" or "combine" assets (e.g., "combine all UX Cabin work history"), you MUST:
          - Identify all relevant assets by company and type.
          - Select ONE asset as the "master" to keep.
          - Consolidate ALL unique description bullets (limit to top 6 most relevant for current target).
          - Return an action: "merge" with master_asset and remove_ids.
    2.  **Exhaustive Selection:** If asked to "add" or "include" a category (e.g., "Add all my HealthTech articles" or "Include all recommendations"), you MUST find EVERY matching ID in the libraryContext and include them in the 'updatedResume.assets' array.
    3.  **Trimming Rule:** For ANY modification to work history, always trim the description to the 5-6 most high-impact bullets.

    **STRATEGY GUIDELINES:**
    - **TECHNICAL ANCHORING:** Highlight VS Code, Docker, and the Terminal to distinguish her from standard "Designers."

    **If a CRUD operation is detected:**
    - Extract all details (title, type, company, description, ROI, ID).
    - Set the 'action' field (add, update, remove).

    **If a request to modify or "retry" the draft is detected:**
    - Set the 'action' to 'chat'.
    - In 'reply', explain the strategic reasoning.
    - CRITICAL: The "updatedResume" object MUST contain the full "assets" array. Do not omit it.
    - Provide the modified resume object in 'updatedResume'.

    **Return a JSON object:**
    {
      "action": "chat" | "add" | "update" | "remove" | "merge",
      "reply": "Strategic message or confirmation.",
      "updatedResume": { 
        "assets": [ /* full array of selected asset objects */ ],
        "strategicHook": "The summary",
        "targetTitle": "...",
        "mappedTitle": "...",
        "coverLetter": "..."
      },
      "master_asset": { /* For 'merge' action */ },
      "remove_ids": [ /* For 'merge' action */ ],
      "asset": { /* For 'add' or 'update' actions */ },
      "remove_criteria": { /* For 'remove' action */ },
      "suggestedAssets": []
    }
`;
