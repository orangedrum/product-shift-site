// --- Content Configuration (The "Chameleon" Logic) ---
export const contentConfig = {
  tech: {
    title: "AI-Powered UX Agent",
    subtitle: "Select 3-5 personas and define their goal to run a simulated usability analysis.",
    card1Title: "The What",
    card1Subtitle: "What url are we testing today?",
    card2Title: "The Who",
    card2Subtitle: "Who would be most likely to visit this URL",
    card3Title: "The Why",
    card3Subtitle: "Why are you testing this site today?",
    card3Hint: "it's recommended you pass the initial \"understanding my site\" task/objective before you move on to any other objective.",
    task1: "Quickly understand what this page is about",
    task2: "Make a purchase / Sign up (Think Aloud)",
    runButton: "Run Analysis",
    analyzing: "Analyzing..."
  },
  smb: {
    title: "Instant Insight Website Tester",
    subtitle: "See your website through the eyes of your visitors to find ways to improve conversion.",
    card1Title: "The What",
    card1Subtitle: "Which website or URL do you want to check?",
    card2Title: "The Who",
    card2Subtitle: "Choose 3-5 synthesized users who most likely buy from you.",
    card3Title: "The Why",
    card3Subtitle: "Think about why you are doing this.",
    card3Hint: "Before users can do anything, they need to understand what your website is. We recommend only after passing this the first impression test to then move to the conversion test.",
    task1: "Check my First Impression (Do they get it?)",
    task2: "Test my Checkout/Signup Process",
    runButton: "Check My Site",
    analyzing: "Checking..."
  }
};

export type UserSegment = 'tech' | 'smb';