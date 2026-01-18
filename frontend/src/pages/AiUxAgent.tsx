// Fixed imports to resolve runtime crash
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, FileText, Users, ShieldAlert, ExternalLink, Plus, X, PlusCircle, Gift, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AnalysisErrorCard, AnalysisError } from '../components/AnalysisErrorCard';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';

// Define types for the API response and error
type UserSession = {
  persona: string;
  description: string;
  avatar: string;
  analysis: string;
};

type AnalysisResponse = {
  message: string;
  title: string;
  url?: string;
  screenshot?: string;
  userSessions: UserSession[];
  expertReport: string;
  scores?: {
    usability: number;
    desirability: number;
    clarity: number;
  };
};

// Helper to format simple markdown to HTML
const formatText = (text: string) => {
  if (!text) return <p className="text-gray-500 italic">No analysis text generated. Please try running the test again.</p>;
  
  // 1. Targeted Cleanup: Only remove the specific JSON block if it leaks (containing "usability":)
  let cleanText = text.replace(/\{[\s\S]*?"usability":[\s\S]*?\}/g, '');

  // 2. Safety Net: If cleanup removed everything (e.g. AI returned ONLY JSON), revert to original
  if (!cleanText.trim()) cleanText = text;

  const lines = cleanText.split('\n')
    .filter(line => !line.match(/^\|.*\|$/)) // Filter out markdown table separator lines
    .filter(line => line.trim().length > 0); // Remove empty lines

  // 3. Ultimate Fallback: If lines are empty after filtering, render raw text
  if (lines.length === 0) {
     return <p className="text-black whitespace-pre-wrap">{text}</p>;
  }

  return lines.map((line, index) => {
    // Headers
    if (line.includes('TEST RESULT: PASS')) {
      return (
        <div key={index} className="mb-6">
          <h2 className="text-2xl font-black text-black flex items-center gap-2">
            Test Result: <span className="text-green-600 flex items-center gap-2">PASS <span className="text-3xl">👍</span></span>
          </h2>
        </div>
      );
    }
    if (line.includes('TEST RESULT: FAIL')) {
      return (
        <div key={index} className="mb-6">
          <h2 className="text-2xl font-black text-black flex items-center gap-2">
            Test Result: <span className="text-red-600 flex items-center gap-2">FAIL <span className="text-3xl">👎</span></span>
          </h2>
        </div>
      );
    }

    if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-black">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-black">{line.replace('## ', '')}</h2>;
    
    // Issue vs Fix Styling (Neutralized)
    if (line.toUpperCase().includes('**ISSUE:**')) {
      return (
        <div key={index} className="mt-4 p-4 bg-gray-200 border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg">
          <p className="text-black"><strong className="font-bold text-black">ISSUE:</strong> {line.replace(/- \*\*ISSUE:\*\*/i, '').replace(/\*\*ISSUE:\*\*/i, '')}</p>
        </div>
      );
    }
    if (line.toUpperCase().includes('**FIX:**')) {
      return (
        <div key={index} className="mb-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg">
          <p className="text-black"><strong className="font-bold text-black">FIX:</strong> {line.replace('- **FIX:**', '').replace('**FIX:**', '')}</p>
        </div>
      );
    }

    // Bold
    const parts = line.split(/(\*\*.*?\*\*)/g);
    
    // Check for Sentiment Pills [Positive], [Neutral], [Negative]
    const content = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-black">{part.slice(2, -2)}</strong>;
      }
      
      // Split by sentiment tags
      const subParts = part.split(/(\[(?:Positive|Neutral|Negative)\])/g);
      return subParts.map((subPart, j) => {
        if (subPart === '[Positive]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-green-700 bg-green-100 rounded-full border border-green-200">Positive</span>;
        if (subPart === '[Neutral]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-yellow-800 bg-yellow-100 rounded-full border border-yellow-200">Neutral</span>;
        if (subPart === '[Negative]') return <span key={`${i}-${j}`} className="inline-block px-2 py-0.5 mx-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-200">Negative</span>;
        return subPart;
      });
    });

    return <p key={index} className="mb-2 text-black leading-relaxed">{content}</p>;
  });
};

// Custom Security Alert Component (Matches user's exact design)
const SecurityAlert: React.FC<{ isBlocking?: boolean; onReset?: () => void }> = ({ isBlocking = false, onReset }) => (
  <div className="max-w-2xl mx-auto mt-8 bg-white border border-gray-200 rounded-xl shadow-lg p-8 animate-fade-in">
    <div className="flex flex-col items-center text-center gap-6">
      <div className="p-4 bg-orange-50 rounded-full">
        <ShieldAlert className="text-orange-500" size={48} />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-900">Security Connection Issue</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Our AI agent detected a potential issue with this site's SSL/TLS certificate (net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH).
        </p>
      </div>

      <div className="w-full bg-gray-50 rounded-lg border border-gray-100 p-5 text-left">
        <h4 className="font-semibold text-gray-900 text-sm mb-3 uppercase tracking-wider">How to fix this</h4>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <CheckCircle className="text-green-500 shrink-0" size={18} />
            <span>Check if your SSL certificate is valid and not expired.</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle className="text-green-500 shrink-0" size={18} />
            <span>Ensure your server supports TLS 1.2 or higher.</span>
          </li>
          <li className="flex gap-3">
            <ExternalLink className="text-indigo-500 shrink-0" size={18} />
            <span>
              Diagnose with 
              <a href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 underline">
                SSL Labs Server Test
              </a>
            </span>
          </li>
        </ul>
      </div>

      {isBlocking && onReset && (
        <button 
          onClick={onReset}
          className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Try Another URL
        </button>
      )}
    </div>
  </div>
);

// Custom Card for Insufficient Credits (Sales Opportunity)
const InsufficientCreditsCard: React.FC<{ onBuy: (plan: string) => void; onClose: () => void }> = ({ onBuy, onClose }) => (
  <div className="max-w-md mx-auto mt-8 animate-fade-in relative">
    <NeoCard title="Insufficient Credits">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
      >
        <X size={24} />
      </button>
      <div className="text-center mb-6">
        <div className="bg-amber-100 p-4 rounded-full inline-block mb-4">
          <AlertCircle className="text-amber-600" size={48} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Out of Tests</h3>
        <p className="text-gray-600 font-medium">
          You have used all your available tests. Top up your account to continue analyzing websites.
        </p>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => onBuy('pack-3')}
          className="w-full flex items-center justify-between p-4 border-2 border-black rounded-xl hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
        >
          <span className="font-bold text-black">3 Tests</span>
          <span className="font-black text-black">$14</span>
        </button>

        <button 
          onClick={() => onBuy('pack-15')}
          className="w-full flex items-center justify-between p-4 border-2 border-black bg-[#ff8c00] rounded-xl hover:bg-[#ffa500] transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
        >
          <div className="text-left">
            <span className="block font-bold text-black">15 Tests</span>
            <span className="text-xs text-black font-medium">Best Value</span>
          </div>
          <span className="font-black text-black">$69</span>
        </button>
        
        <div className="pt-4 border-t border-gray-200 text-center">
             <button onClick={() => onBuy('starter')} className="text-indigo-600 font-bold hover:underline text-sm">
                Switch to Monthly Plan ($29/mo)
             </button>
        </div>
      </div>
    </NeoCard>
  </div>
);

// --- Content Configuration (The "Chameleon" Logic) ---
const contentConfig = {
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

type UserSegment = 'tech' | 'smb';

const AiPoweredUxHealthtech: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [savedSegment, setSavedSegment] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['alex-busy-pro', 'sam-college-student', 'charlie-family-worker']);
  const [taskType, setTaskType] = useState('understand');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [showPersonaError, setShowPersonaError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<number>(0); // Index of the active tab
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'summary'>('full');
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [bgGradient, setBgGradient] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy Link');
  const [authLoading, setAuthLoading] = useState(true);
  const [highlightCredits, setHighlightCredits] = useState(false);
  const prevCreditsRef = useRef<number | null>(null);
  const shouldAnimateOnMount = useRef(false);

  // Mouse tracking for interactive background
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const x = e.clientX;
        const y = e.clientY;
        containerRef.current.style.setProperty('--mouse-x', `${x}px`);
        containerRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Randomize background on mount
  useEffect(() => {
    const container = containerRef.current;
    const updateGradient = () => {
      if (container) {
        const r = () => Math.floor(Math.random() * 100);
        container.style.setProperty('--pos-x-1', `${r()}%`);
        container.style.setProperty('--pos-y-1', `${r()}%`);
        container.style.setProperty('--pos-x-2', `${r()}%`);
        container.style.setProperty('--pos-y-2', `${r()}%`);
        container.style.setProperty('--pos-x-3', `${r()}%`);
        container.style.setProperty('--pos-y-3', `${r()}%`);
      }
    };

    updateGradient();
    const interval = setInterval(updateGradient, 3000); // Animate every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // --- UNIFIED BOOT SEQUENCE ---
  // This replaces scattered useEffects to ensure a deterministic loading order
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      // 1. Auth Check
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      setSession(currentSession);
      setAuthLoading(false);

      if (!currentSession) {
        // Security: If not logged in, strictly redirect to login
        navigate('/login');
        return; 
      }

      // 2. URL Parsing & Cleanup
      const urlRef = searchParams.get('ref');
      const urlSegment = searchParams.get('segment');
      const urlNewCredit = searchParams.get('new_credit');

      if (urlNewCredit === 'true') {
        shouldAnimateOnMount.current = true;
      }

      // 3. Referral Claiming (Priority)
      let pendingRef = urlRef || localStorage.getItem('pendingReferral');
      let referralClaimed = false;
      if (pendingRef) {
        try {
          const res = await fetch('/api/user/claim-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentSession.user.email, referralCode: pendingRef, segment: urlSegment })
          });
          const data = await res.json();
          if (data.success) {
            localStorage.removeItem('pendingReferral');
            shouldAnimateOnMount.current = true; // Force animation on successful claim
            referralClaimed = true;
          }
        } catch (err) {
          console.error('Referral Claim Error:', err);
        }
      }

      // 4. Data Fetching (The Source of Truth)
      // Retry logic: If we just claimed a referral, ensure we see the credit (handle potential DB latency)
      let customerData = null;
      for (let i = 0; i < 3; i++) {
          const { data, error } = await supabase
            .from('customers')
            .select('credits, plan_status, referral_code, segment')
            .eq('email', currentSession.user.email)
            .maybeSingle();
          
          if (error) console.error('Error fetching customer data:', error);
          customerData = data;

          // If we didn't claim a referral, or if we found credits, stop retrying
          if (!referralClaimed || (data && data.credits > 0)) break;
          
          // If we claimed but found 0 credits, wait and retry
          if (i < 2) await new Promise(r => setTimeout(r, 500));
      }
      
      if (!mounted) return;

      // Initialize State
      setCredits(customerData?.credits ?? 0);
      setPlanStatus(customerData?.plan_status);
      setSavedSegment(customerData?.segment || null);
      
      if (customerData?.referral_code) {
        setReferralCode(customerData.referral_code);
      } else {
        // Generate referral code if missing (Await this to ensure row exists before segment update)
        const genRes = await fetch('/api/user/generate-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentSession.user.email })
        });
        const genData = await genRes.json();
        if (mounted) setReferralCode(genData.referralCode);
      }

      // 5. Update Customer Segment (Source of Truth)
      if (urlSegment) {
        // Only provision segment if user doesn't have one yet in the DB
        if (!customerData?.segment) {
          await supabase.from('customers').update({ segment: urlSegment }).eq('email', currentSession.user.email);
          if (mounted) setSavedSegment(urlSegment);
        }
      }

      // 6. Clean URL (Once everything is processed)
      if (urlRef || urlSegment || urlNewCredit) {
        setSearchParams({}, { replace: true });
      }
    };

    boot();

    // Realtime Subscription for updates
    const channel = supabase
      .channel('customer-credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `email=eq.${session?.user?.email}`, // This might be stale in the closure, but boot handles initial load
        },
        (payload) => {
          const newData = payload.new;
          if (newData.credits !== undefined) setCredits(newData.credits);
          if (newData.plan_status !== undefined) setPlanStatus(newData.plan_status);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [searchParams, setSearchParams]); // Re-run if params change (e.g. redirect)

  // Helper to refresh customer data (Used after test runs)
  const refreshCustomerData = async () => {
    if (!session?.user?.email) return;
    const { data } = await supabase
      .from('customers')
      .select('credits, plan_status')
      .eq('email', session.user.email)
      .maybeSingle();
    if (data) {
      setCredits(data.credits);
      setPlanStatus(data.plan_status);
    }
  };

  // Animation Effect
  useEffect(() => {
    if (credits !== null) {
      const isIncrease = prevCreditsRef.current !== null && credits > prevCreditsRef.current;
      const isInitialLoadWithFlag = prevCreditsRef.current === null && shouldAnimateOnMount.current;

      if (isIncrease || isInitialLoadWithFlag) {
        setHighlightCredits(true);
        setTimeout(() => setHighlightCredits(false), 2000);
        shouldAnimateOnMount.current = false;
      }
    }
    prevCreditsRef.current = credits;
  }, [credits]);

  // Simulated progress bar effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && selectedPersonas.length > 0) {
      setProgress(5); // Start at 5%
      // Dynamically calculate duration: 6.5s per persona + 6.5s for the final report
      const duration = (selectedPersonas.length + 1) * 6500;
      const step = 200;
      
      interval = setInterval(() => {
        setProgress(old => {
          // Cap at 95% until the actual result comes back, to feel more authentic.
          const newProgress = old + (100 / (duration / step));
          if (newProgress >= 95) return 95;
          return old + (100 / (duration / step));
        });
      }, step);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, selectedPersonas.length]);

  const availablePersonas = [
    { id: 'alex-busy-pro', name: 'Alex', description: 'Busy professional, 2 kids < 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' },
    { id: 'sam-college-student', name: 'Sam', description: 'Budget-conscious student', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam' },
    { id: 'charlie-family-worker', name: 'Charlie', description: 'Masculine, patriotic worker', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie' },
    { id: 'beth-homemaker', name: 'Beth', description: '45+ Homemaker, poor eyesight', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Beth' },
    { id: 'sarah-social-shopper', name: 'Sarah', description: 'Social influencer & avid shopper', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
    { id: 'elizabeth-wealthy-elite', name: 'Elizabeth', description: 'Wealthy, highly educated', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Katherine' },
    { id: 'marcus-c-suite', name: 'Marcus', description: 'Fortune 500 C-Level Exec', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus' },
    { id: 'linda-business-owner', name: 'Linda', description: 'Business Owner (10 employees)', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda' }
  ];

  const togglePersona = (id: string) => {
    setSelectedPersonas(prev => 
      {
        const newSelection = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
        if (newSelection.length >= 3) setShowPersonaError(false);
        return newSelection;
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (selectedPersonas.length < 3 || selectedPersonas.length > 5) {
      setShowPersonaError(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    // Determine final goal string
    let finalGoal = 'Quickly understand what this page is about.';
    if (taskType === 'purchase') finalGoal = 'Attempt to make a purchase or sign up, thinking aloud about the decision process.';

    // Ensure the URL has a protocol
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    try {
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fullUrl, personaIds: selectedPersonas, goal: finalGoal, email: session?.user?.email }), 
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw { error: 'Server Error', details: `The server returned an unexpected response (${response.status}). Please try again later.` };
      }

      if (!response.ok) {
        // Assuming the backend sends a JSON error object
        throw data;
      }

      // VALIDATION: Prevent "Blank Screen" crashes by ensuring data integrity
      if (!data.userSessions || !Array.isArray(data.userSessions) || data.userSessions.length === 0) {
         throw { error: 'Analysis Failed', details: 'The AI agent could not generate user sessions for this URL. It might be inaccessible.' };
      }
      if (!data.expertReport) {
         throw { error: 'Report Generation Failed', details: 'The AI agent failed to generate the expert report.' };
      }

      console.log('✅ Analysis Data Validated:', data); // Debugging
      setResult(data);
      
      // Optimistic update for gamification: Decrement credit counter visually
      if (credits !== null && credits > 0) {
        setCredits(credits - 1);
      }

      // SYNC: Poll backend to ensure credits and referral rewards are accurate
      const pollSync = async (attempts = 0) => {
        if (attempts > 3) return;
        await refreshCustomerData();
        setTimeout(() => pollSync(attempts + 1), 2500);
      };
      pollSync();
    } catch (err: any) {
      console.error('Failed to connect to the backend:', err);
      setError({
        error: err.error || 'An unknown error occurred.',
        details: err.details || 'Could not retrieve details.',
        usageCounted: err.usageCounted,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setResult(null);
    setError(null);
    setIsLoading(false);
    setUrl('');
  };

  const handlePrintClick = () => {
    setShowDownloadDialog(true);
  };

  const confirmPrint = (mode: 'full' | 'summary') => {
    setPrintMode(mode);
    setShowDownloadDialog(false);

    // Set custom title for PDF filename
    const originalTitle = document.title;
    if (result?.title) {
      const dateStr = new Date().toISOString().split('T')[0];
      document.title = `${result.title} - ${dateStr}`;
    }

    // Small delay to allow React to update the DOM classes before the print dialog opens
    setTimeout(() => {
      window.print();
      setTimeout(() => { document.title = originalTitle; }, 500);
    }, 100);
  };

  // Determine Segment: Default to 'tech', but check user metadata if logged in
  // Prioritize URL param for immediate feedback during onboarding/referral flows
  const urlSegment = searchParams.get('segment');
  const userSegment: UserSegment = (savedSegment === 'smb' || savedSegment === 'tech') ? (savedSegment as UserSegment) : ((urlSegment === 'smb' ? 'smb' : null) || 'tech');
  const text = contentConfig[userSegment] || contentConfig.tech;
  const pricingLink = userSegment === 'smb' ? '/simple-website-checkup#pricing' : '/landingpg-aiuxagent#pricing';

  const handleCheckout = async (planId: string, applyDiscount = false) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: planId, 
          email: session?.user?.email, 
          segment: userSegment, 
          applyDiscount,
          promotekit_referral: (window as any).promotekit_referral 
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Upgrade failed", e);
    }
  };

  const handleReplenish = () => {
    if (userSegment === 'smb') {
      setShowRefillModal(true);
    } else {
      handleCheckout('starter');
    }
  };

  const copyReferralLink = () => {
    const segmentParam = userSegment === 'smb' ? '&segment=smb' : '';
    const link = `${window.location.origin}/claim-test?ref=${referralCode}${segmentParam}`;
    
    navigator.clipboard.writeText(link).then(() => {
      setCopyButtonText('Link Copied!');
      setTimeout(() => setCopyButtonText('Copy Link'), 2000);
    });
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(1750px circle at 100% 0%, #ff1493 0%, #ff1493 40%, #ff0000 60%, transparent 80%),
          radial-gradient(at var(--pos-x-1, 50%) var(--pos-y-1, 50%), #ff8c00 0%, transparent 50%),
          radial-gradient(at var(--pos-x-2, 20%) var(--pos-y-2, 80%), #ff1493 0%, transparent 50%),
          radial-gradient(at var(--pos-x-3, 80%) var(--pos-y-3, 20%), #ff0000 0%, transparent 50%),
          #ffffff
        `,
        backgroundSize: '100% 100%',
        transition: '--pos-x-1 3s ease, --pos-y-1 3s ease, --pos-x-2 3s ease, --pos-y-2 3s ease, --pos-x-3 3s ease, --pos-y-3 3s ease'
      }}
    >
    {authLoading ? (
      <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>
    ) : (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <style>{`
        @property --pos-x-1 { syntax: '<percentage>'; inherits: false; initial-value: 50%; }
        @property --pos-y-1 { syntax: '<percentage>'; inherits: false; initial-value: 50%; }
        @property --pos-x-2 { syntax: '<percentage>'; inherits: false; initial-value: 20%; }
        @property --pos-y-2 { syntax: '<percentage>'; inherits: false; initial-value: 80%; }
        @property --pos-x-3 { syntax: '<percentage>'; inherits: false; initial-value: 80%; }
        @property --pos-y-3 { syntax: '<percentage>'; inherits: false; initial-value: 20%; }
        
        @media print {
          @page { margin: 1.5cm; size: auto; }
          body * { visibility: hidden; }
          #report-section, #report-section * { visibility: visible; }
          #report-section { position: absolute; left: 0; top: 0; width: 100%; }
          
          /* Cover Page Styling - Compact for Print */
          .report-cover { margin-bottom: 1cm; page-break-after: avoid; }
          
          .no-print { display: none !important; }
          
          /* Ensure background colors and images print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Typography for Print */
          body { font-size: 12pt; line-height: 1.5; color: #000; }
          h1 { font-size: 32pt; margin-bottom: 0.5cm; }
          h2 { font-size: 20pt; margin-top: 1cm; margin-bottom: 0.5cm; page-break-after: avoid; border-bottom: 2px solid #000; padding-bottom: 10px; }
          h3 { font-size: 14pt; margin-top: 0.5cm; page-break-after: avoid; }
          p { margin-bottom: 0.5cm; }
          
          /* Print Modes */
          .print-summary-only .user-sessions-column { display: none !important; }
          .print-summary-only .expert-report-column { width: 100% !important; grid-column: span 12 !important; }
          
          /* Full Report Print Styling */
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          
          /* Layout Fixes */
          .grid { display: block !important; }
          .lg\\:col-span-5, .lg\\:col-span-7 { width: 100% !important; margin-bottom: 1cm; grid-column: span 12 !important; }
          img { max-width: 100% !important; height: auto !important; page-break-inside: avoid; }
          .user-sessions-column { margin-bottom: 2rem; }
          
          /* Page Breaks */
          .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .page-break-before { page-break-before: always; display: block; }

          /* Force Neo Styling in Print */
          .border-2 { border-width: 2px !important; border-color: #000 !important; }
        }
      `}</style>

      <div className={`relative mx-auto transition-all duration-500 ${result ? 'max-w-7xl' : 'max-w-3xl'}`}>
        
        {/* --- BEFORE RESULTS: Vertical Widgets --- */}
        {!result && !error && (
          <div className="no-print lg:absolute lg:top-32 lg:-right-[160px] lg:w-32 mb-8 lg:mb-0 z-20 flex flex-col gap-4">
             
             {/* 1. Available Tests (Vertical) */}
             <div className="bg-black rounded-xl border-2 border-gray-800 shadow-lg overflow-hidden">
                <div className="p-5 text-center">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Available Tests</span>
                   <div className="flex justify-center items-center gap-3 mb-1">
                      {credits === null ? (
                        <span className="text-5xl font-black text-gray-600 font-mono leading-none animate-pulse">--</span>
                      ) : (
                        <span className={`text-5xl font-black font-mono leading-none tabular-nums transition-all duration-500 ${highlightCredits ? 'text-[#39ff14] scale-110' : 'text-[#00bfff]'}`} style={{ textShadow: highlightCredits ? '0 0 20px rgba(57, 255, 20, 0.8)' : '0 0 10px rgba(0, 191, 255, 0.5)' }}>
                          {credits.toString().padStart(2, '0')}
                        </span>
                      )}
                      
                      <button 
                        onClick={handleReplenish}
                        className="text-gray-500 hover:text-white transition-colors transform hover:scale-110 active:scale-95"
                        title="Add Tests"
                      >
                        <PlusCircle size={28} />
                      </button>
                   </div>
                </div>
                
                <div className="bg-gray-900 p-3 border-t border-gray-800 text-center">
                  <p className="text-[10px] font-bold text-white leading-relaxed">
                    Low on Tests?{' '}
                    <button onClick={handleReplenish} className="underline hover:text-gray-300 transition-all">
                      Refill
                    </button>
                  </p>
                </div>
              </div>

              {/* 2. Referral Card (Vertical) */}
              {planStatus === 'active' ? (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl border-2 border-black shadow-lg overflow-hidden text-white">
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2 text-2xl">🤝</div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 leading-tight">Partner<br/>Program</h3>
                    <p className="text-[10px] leading-tight mb-3 opacity-90">Earn cash by referring others.</p>
                    <a 
                      href="https://theproductshift.promotekit.com" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white text-black text-xs font-bold py-2 rounded flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
                    >
                      Partner Portal
                    </a>
                  </div>
                </div>
              ) : (referralCode && (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl border-2 border-black shadow-lg overflow-hidden text-white animate-fade-in">
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2 text-2xl">🎁</div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 whitespace-nowrap">Give 1, Get 1</h3>
                    <p className="text-[10px] leading-tight mb-3 opacity-90">Share a free test, get a free test when a new user uses it.</p>
                    <button 
                      onClick={copyReferralLink}
                      className="w-full bg-white text-indigo-600 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors"
                    >
                      {copyButtonText === 'Link Copied!' ? null : <Copy size={12} />} {copyButtonText}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

      <div className="w-full">
      {!result && !error && (
        <div className="no-print">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black mb-4 text-black drop-shadow-sm">{text.title}</h1>
            <p className="text-lg text-black font-medium">{text.subtitle}</p>
          </div>
      
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Card 1: The What */}
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black text-black mb-1">{text.card1Title}</h2>
              <p className="text-gray-600 font-medium mb-6">{text.card1Subtitle}</p>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <span className="text-black font-bold text-lg">https://</span>
                </div>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//, ''))}
                  className="block w-full pl-24 pr-6 py-6 text-xl font-normal text-gray-900 bg-white border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_#000] focus:shadow-[5.5px_7px_0px_0px_#000] focus:outline-none transition-all duration-200 placeholder-gray-500"
                  placeholder="example.com"
                  required
                />
              </div>
            </div>

            {/* Card 2: The Who */}
            <div id="card-who" className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black text-black mb-1">{text.card2Title}</h2>
              <p className="text-gray-600 font-medium mb-6">{text.card2Subtitle}</p>

              <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 text-xs text-gray-600 mb-6">
                <strong className="font-bold text-gray-800">Why 3-5 users?</strong> According to the Nielsen Norman Group, testing with 5 users typically uncovers 85% of usability problems. 
                We require a minimum of 3 synthesized users to ensure we identify converging patterns rather than isolated opinions.
                <a href="https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/" target="_blank" rel="noreferrer" className="underline ml-1 font-medium">Learn more</a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePersonas.map((persona) => (
                  <div 
                    key={persona.id} 
                    onClick={() => togglePersona(persona.id)}
                    className={`
                      flex items-center p-3 rounded-xl cursor-pointer transition-all border-2 border-black
                      ${selectedPersonas.includes(persona.id)
                        ? 'bg-[#ff8c00] shadow-[2px_2px_0px_0px_#000] translate-x-[2px] translate-y-[2px]'
                        : 'bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]'}
                      ${!selectedPersonas.includes(persona.id) && selectedPersonas.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <img src={persona.avatar} alt={persona.name} className="w-10 h-10 rounded-full mr-3 bg-white border border-black" />
                    <div>
                      <div className="text-black font-bold">{persona.name}</div>
                      <div className="text-xs text-black font-medium">{persona.description}</div>
                    </div>
                    {selectedPersonas.includes(persona.id) && (
                      <CheckCircle className="ml-auto text-black" size={20} />
                    )}
                  </div>
                ))}
              </div>
              {showPersonaError && (
                <div className="mt-3 p-3 bg-red-100 border-2 border-black rounded-lg text-sm text-black font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_#000]">
                  <AlertCircle size={16} />
                  <strong>Action Required:</strong> Please select between 3 and 5 personas to run the analysis.
                </div>
              )}
            </div>

            {/* Card 3: The Why */}
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 className="text-2xl font-black text-black mb-1">{text.card3Title}</h2>
              <p className="text-gray-600 font-medium mb-2">{text.card3Subtitle}</p>
              <p className="text-sm text-gray-500 mb-6 italic">{text.card3Hint}</p>

              <div className="space-y-3">
                <div className="flex items-center p-3 border-2 border-transparent hover:bg-gray-50 rounded-lg transition-colors">
                  <input id="task-understand" name="task" type="radio" checked={taskType === 'understand'} onChange={() => setTaskType('understand')} className="h-5 w-5 text-black border-2 border-black focus:ring-0 checked:bg-black cursor-pointer" />
                  <label htmlFor="task-understand" className="ml-3 block text-base text-black font-bold cursor-pointer">{text.task1}</label>
                </div>
                <div className="flex items-center p-3 border-2 border-transparent hover:bg-gray-50 rounded-lg transition-colors">
                  <input id="task-purchase" name="task" type="radio" checked={taskType === 'purchase'} onChange={() => setTaskType('purchase')} className="h-5 w-5 text-black border-2 border-black focus:ring-0 checked:bg-black cursor-pointer" />
                  <label htmlFor="task-purchase" className="ml-3 block text-base text-black font-bold cursor-pointer">{text.task2}</label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || selectedPersonas.length < 3 || selectedPersonas.length > 5}
              className={`w-full relative overflow-hidden inline-flex justify-center py-4 px-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-lg font-bold rounded-xl text-white transition-all bg-[#ff1493] hover:bg-[#ff69b4] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              {isLoading && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
              <span className="relative z-10">
                {isLoading ? `${text.analyzing} ${Math.round(progress)}%` : text.runButton}
              </span>
              </button>
              {(selectedPersonas.length < 3 || selectedPersonas.length > 5) && (
                <p 
                  className="text-center text-red-600 font-bold mt-2 cursor-pointer hover:underline animate-pulse" 
                  onClick={() => document.getElementById('card-who')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  pick between 3-5 users
                </p>
              )}
          </form>
        </div>
      )}

      {result && (
        <div className="no-print text-center mb-12 animate-fade-in max-w-3xl mx-auto">
           <h1 className="text-4xl font-black mb-2 text-black">Analysis Complete</h1>
           <p className="text-black font-medium text-lg">Review the user sessions and the aggregated research report below.</p>
           <button onClick={resetState} className="mt-6 mb-8 bg-black text-white font-bold py-3 px-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#fff] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
             Run Another Test
           </button>
           
           {/* --- AFTER RESULTS: Horizontal Widget --- */}
           <div className="bg-black text-white p-3 rounded-xl border-2 border-gray-800 shadow-lg flex items-center justify-between gap-4 max-w-md mx-auto mb-8">
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Tests</span>
                {credits === null ? (
                   <span className="text-xl font-black text-gray-500 font-mono animate-pulse">--</span>
                 ) : (
                   <span className={`text-xl font-black font-mono tabular-nums transition-all duration-500 ${highlightCredits ? 'text-[#39ff14] scale-110' : 'text-[#00bfff]'}`} style={{ textShadow: highlightCredits ? '0 0 20px rgba(57, 255, 20, 0.8)' : '0 0 10px rgba(0, 191, 255, 0.5)' }}>{credits.toString().padStart(2, '0')}</span>
                )}
             </div>
             
             <div className="flex items-center gap-3">
                <button onClick={handleReplenish} className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5 group">
                   <PlusCircle size={14} className="group-hover:text-[#00bfff] transition-colors" /> 
                   <span>Refill</span>
                </button>
             </div>
          </div>
        </div>)}

      {/* Download Dialog */}
      {showDownloadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 no-print" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Download Report</h3>
            <p className="text-gray-600 mb-6 text-sm">Choose the format for your PDF export.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => confirmPrint('full')}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
              >
                <div className="bg-indigo-100 p-2 rounded-lg group-hover:bg-indigo-200">
                  <Users className="text-indigo-600" size={24} />
                </div>
                <div>
                  <span className="block font-semibold text-gray-900">Full Report</span>
                  <span className="text-xs text-gray-500">Includes all User Session transcripts & Expert Analysis</span>
                </div>
              </button>

              <button 
                onClick={() => confirmPrint('summary')}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
              >
                <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200">
                  <FileText className="text-green-700" size={24} />
                </div>
                <div>
                  <span className="block font-semibold text-gray-900">Summary Only</span>
                  <span className="text-xs text-gray-500">Expert Analysis & Scores only (Compact)</span>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setShowDownloadDialog(false)}
              className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Refill Credits Modal */}
      {showRefillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 no-print" style={{ zIndex: 9999 }}>
          <div className="max-w-md w-full relative">
            <NeoCard title="Refill Tests" className="relative">
              <button 
                onClick={() => setShowRefillModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
              >
                <X size={24} />
              </button>
              
              <p className="text-gray-600 mb-6 font-medium">Select a test pack to continue testing immediately.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleCheckout('pack-3')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black rounded-xl hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <span className="font-bold text-lg text-black">3 Tests</span>
                  <span className="font-black text-xl text-black">$14</span>
                </button>

                <button 
                  onClick={() => handleCheckout('pack-15')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black bg-[#ff8c00] rounded-xl hover:bg-[#ffa500] transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="text-left">
                    <span className="block font-bold text-lg text-black">15 Tests</span>
                    <span className="text-xs text-black font-medium">Best Value</span>
                  </div>
                  <span className="font-black text-xl text-black">$69</span>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  Need consistent testing? <br/>
                  Keeping your existing tests and <button onClick={() => handleCheckout('starter')} className="text-indigo-600 font-bold hover:underline">switch to a Monthly Plan</button>
                </p>
              </div>
            </NeoCard>
          </div>
        </div>
      )}

      {result && (
        <div id="report-section" className={`animate-fade-in w-full ${printMode === 'summary' ? 'print-summary-only' : ''}`}>
          {/* Conditionally render the SSL warning at the top of the report */}
          {result.expertReport.startsWith('|||SSL_WARNING_ALERT|||') && <SecurityAlert isBlocking={false} />}
          
          {/* Report Header (Visible on Screen & Print) */}
          <div className="mb-8 report-cover break-inside-avoid">
            <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] text-left">
              <h1 className="text-4xl font-black text-black mb-2">{result.title || 'UX Audit Report'}</h1>
              <div className="text-black flex flex-col gap-1">
                <span className="font-mono text-gray-700 font-bold text-lg">{result.url || url}</span>
                <span className="text-sm font-medium">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Persona Summaries (Span 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                <div className="p-4 border-b-2 border-black bg-gray-50 no-print">
                  <h2 className="text-lg font-bold text-black">User Sessions</h2>
                  <p className="text-xs text-black font-medium">Click a user to view their detailed feedback</p>
                </div>
                
                {/* Tab Bar */}
                <div className="flex overflow-x-auto p-2 gap-2 bg-white border-b-2 border-black no-scrollbar screen-only">
                  {result.userSessions.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`flex flex-col items-center p-3 rounded-lg min-w-[110px] transition-all border-2 ${
                        activeTab === idx 
                          ? 'bg-[#ff8c00] border-black shadow-[2px_2px_0px_0px_#000]' 
                          : 'bg-white hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <img 
                        src={res.avatar} 
                        alt={res.persona}
                        onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${res.persona}`; }}
                        className={`w-16 h-16 rounded-full border-2 border-black bg-white`}
                      />
                      <span className={`text-xs mt-1 font-bold truncate w-full text-center text-black`}>
                        {res.persona}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Active Tab Content */}
                <div className="p-6 bg-white min-h-[400px] screen-only">
                  {result.userSessions[activeTab] && (() => {
                    const res = result.userSessions[activeTab];
                    const userSection = res.analysis || '';
                    const parts = userSection.split('|||USER_DETAILS|||') || ['', ''];
                    const details = parts[1] || 'No detailed feedback provided.';
                    const moodAndBubble = parts[0] || '';
                    const bubbleParts = moodAndBubble.split('|||USER_BUBBLE|||') || ['', ''];
                    const userBubble = bubbleParts[1]?.trim() || "I'm analyzing the page...";

                    return (
                      <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-bold text-black">{res.persona}</h3>
                          <span className="text-xs text-black font-bold bg-white px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                            {res.description || 'User Persona'}
                          </span>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-[4px_4px_0px_0px_#000] border-2 border-black text-black relative mb-6">
                          <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l-2 border-b-2 border-black transform rotate-45"></div>
                          <p className="text-lg italic text-black leading-relaxed">"{userBubble}"</p>
                        </div>

                        <div className="space-y-4 text-sm text-black bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                          {formatText(details)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* PRINT VIEW: All Sessions List */}
                <div className="hidden print-only mb-8">
                  <div className="bg-white p-4 mb-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] break-inside-avoid">
                    <h2 className="text-2xl font-black text-black m-0" style={{ borderBottom: 'none', paddingBottom: 0 }}>Detailed User Sessions</h2>
                  </div>

                  {result.userSessions.map((res, idx) => {
                    const userSection = res.analysis || '';
                    const parts = userSection.split('|||USER_DETAILS|||') || ['', ''];
                    const details = parts[1] || 'No detailed feedback provided.';
                    const moodAndBubble = parts[0] || '';
                    const bubbleParts = moodAndBubble.split('|||USER_BUBBLE|||') || ['', ''];
                    const userBubble = bubbleParts[1]?.trim() || "I'm analyzing the page...";

                    return (
                      <div key={idx} className="mb-8 pb-8 border-b border-gray-200 last:border-0 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            src={res.avatar} 
                            alt={res.persona}
                            className="w-12 h-12 rounded-full border border-gray-200"
                          />
                          <div>
                            <h3 className="text-lg font-bold text-black">{res.persona}</h3>
                            <span className="text-xs text-black bg-white px-2 py-1 rounded-full border-2 border-black">{res.description}</span>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border-2 border-black text-black mb-4 italic">
                          "{userBubble}"
                        </div>

                        <div className="space-y-2 text-sm text-black">
                          {formatText(details)}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: Expert Report (Span 7) */}
            <div className="lg:col-span-7 h-full expert-report-column page-break-before">
              
              {/* Print-Only Title Card for Full Report */}
              <div className="hidden print-only mb-8">
                <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] text-left">
                  <h1 className="text-3xl font-black text-black mb-2">Full Report & Analysis</h1>
                  <div className="text-black flex flex-col gap-1">
                    <span className="font-mono text-gray-700 font-bold text-lg">{result.url || url}</span>
                    <span className="text-sm font-medium">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] h-full">
                <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4 break-inside-avoid no-print">
                  <h2 className="text-2xl font-bold text-black m-0">UX Research Report</h2>
                  <NeoButton variant="secondary" onClick={handlePrintClick} className="no-print" icon={<FileText size={16} />}>
                    Download PDF
                  </NeoButton>
                </div>

                {/* Render Test Result First for Prominence */}
                <div className="prose max-w-none">
                  {formatText(result.expertReport.replace('|||SSL_WARNING_ALERT|||\n', '').split('\n').find(line => line.includes('TEST RESULT:')) || '')}
                </div>
                
                {/* Charts Section */}
                {result.scores ? (
                  <div className="mb-8 p-6 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] break-inside-avoid">
                    <h3 className="text-lg font-bold text-black mb-4">Performance Metrics</h3>
                    <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Usability', score: result.scores.usability },
                      { name: 'Desirability', score: result.scores.desirability },
                      { name: 'Clarity', score: result.scores.clarity },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        <Cell key="usability" fill="#ff8c00" /> {/* Usability: Orange */}
                        <Cell key="desirability" fill="#ff1493" /> {/* Desirability: Pink */}
                        <Cell key="clarity" fill="#00bfff" /> {/* Clarity: Cyan */}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                  </div>
                ) : null}

                {/* Visual Reference */}
                {result.screenshot && (
                  <div className="mb-8 p-4 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] break-inside-avoid">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Visual Reference</h3>
                    <img src={`data:image/jpeg;base64,${result.screenshot}`} alt="Page Screenshot" className="w-full rounded shadow-sm border-2 border-black" />
                    <p className="text-xs text-black mt-2 text-center">Note: This is a full screenshot. Future versions will include contextual highlights.</p>
                  </div>
                )}

                <div className="prose max-w-none">
                  {/* Render the rest of the report, excluding the already-rendered test result */}
                  {formatText(
                    result.expertReport.replace('|||SSL_WARNING_ALERT|||\n', '').split('\n').filter(line => !line.includes('TEST RESULT:')).join('\n')
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        error.error === 'Site Security Error' ? (
          <SecurityAlert isBlocking={true} onReset={resetState} />
        ) : error.error === 'Insufficient Credits' ? (
           <InsufficientCreditsCard onBuy={handleCheckout} onClose={resetState} />
        ) : error.usageCounted === false ? (
          <AnalysisErrorCard error={error} onReset={resetState} />
        ) : (
          // Fallback to the generic red error box for other errors
          <div className="no-print mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md max-w-3xl mx-auto">
            <h2 className="font-bold">{error.error}</h2>
            <p>{error.details || 'An unknown server error occurred.'}</p>
          </div>
        )
      )}
      </div>
    </div>
    </div>
    )}
    </div>);
};

export default AiPoweredUxHealthtech;
