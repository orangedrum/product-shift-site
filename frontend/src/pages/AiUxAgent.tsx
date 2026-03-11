// Fixed imports to resolve runtime crash
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, FileText, Users, ShieldAlert, ExternalLink, Plus, X, PlusCircle, Gift, Copy, Share2, Download, LogOut, MessageSquare, Star, Bell } from 'lucide-react';
import PrintableComponent from '../components/PrintableComponent';
import { supabase } from '../lib/supabase';
import { AnalysisErrorCard, AnalysisError } from '../components/AnalysisErrorCard';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { FeedbackCard } from '../components/FeedbackCard';
import { SecurityAlert } from '../components/SecurityAlert';
import { SessionExpiredCard } from '../components/SessionExpiredCard';
import { InsufficientCreditsCard } from '../components/InsufficientCreditsCard';
import { contentConfig, UserSegment } from '../config/aiUxAgentConfig';
import PerformanceReport, { PerformanceReportData } from '../components/PerformanceReport';

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
  reportId?: string;
  seoSchema?: any;
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

    // Overall Score Styling (Aligned with Pass/Fail)
    if (line.includes('**Overall Score:**')) {
      const scoreMatch = line.match(/(\d+)\/100/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      const colorClass = score >= 60 ? 'text-green-600' : 'text-red-600';
      return (
        <div key={index} className="mb-8 -mt-4">
           <h3 className={`text-2xl font-black ${colorClass} flex items-center gap-2`}>
             {line.replace(/\*\*/g, '')}
           </h3>
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


const AiPoweredUxHealthtech: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [savedSegment, setSavedSegment] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['alex-busy-pro', 'sam-college-student', 'charlie-family-worker']);
  const [taskType, setTaskType] = useState('understand');
  const [deepAudit, setDeepAudit] = useState(false);
  const [performanceResult, setPerformanceResult] = useState<PerformanceReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [showPersonaError, setShowPersonaError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeResultTab, setActiveResultTab] = useState<'performance' | 'ux'>('performance');
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
  
  // State to track if this is a first purchase event (Robust detection)
  const [isFirstBuy, setIsFirstBuy] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

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

  // --- 1. BOOT SEQUENCE (Auth & URL Params) ---
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
      const urlCoupon = searchParams.get('coupon');
      const urlTarget = searchParams.get('url');
      const urlReferralClaim = searchParams.get('referral_claim');

      if (urlNewCredit === 'true') {
        shouldAnimateOnMount.current = true;
        if (urlReferralClaim !== 'true') {
          setJustPurchased(true);
        }
      }

      // 3. Lazy Initialization (CRITICAL: Ensure Customer Row Exists FIRST)
      // We must create the user (with default 3 credits) before we can add coupon credits to them.
      // CTO FIX: If we have a coupon, skip the default 3 credits so the coupon amount is exact (Control Method).
      try {
        await fetch(`/api/user/check-account?skip_credits=${!!urlCoupon}`, { 
          headers: { 'Authorization': `Bearer ${currentSession.access_token}` } 
        });
      } catch (e) { console.error('Lazy init failed', e); }

      // 4. Referral Claiming
      let pendingRef = urlRef || localStorage.getItem('pendingReferral');
      let referralClaimed = false;
      if (pendingRef) {
        try {
          const res = await fetch('/api/user/claim-referral', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentSession.access_token}`
            },
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

      // 5. Coupon Redemption (Now safe to run because user exists)
      if (urlCoupon) {
        try {
          const res = await fetch('/api/user/redeem-coupon', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentSession.access_token}`
            },
            body: JSON.stringify({ email: currentSession.user.email, code: urlCoupon })
          });
          const data = await res.json();
          if (data.success) shouldAnimateOnMount.current = true;
        } catch (err) {
          console.error('Coupon Auto-Redeem Error:', err);
        }
      }

      // 6. Data Fetching (The Source of Truth)
      // Retry logic: If we just claimed a referral, ensure we see the credit (handle potential DB latency)
      let customerData: any = null;
      for (let i = 0; i < 3; i++) {
          const { data, error } = await supabase
            .from('customers')
            .select('credits, plan_status, referral_code, segment, is_regular_user, is_power_user')
            .eq('email', currentSession.user.email)
            .maybeSingle();
          
          if (error) console.error('Error fetching customer data:', error);
          customerData = data;

          // If we didn't claim a referral, or if we found credits, stop retrying
          if ((!referralClaimed && !urlNewCredit) || (data && data.credits > 0)) break;
          
          // If we claimed but found 0 credits, wait and retry
          if (i < 2) await new Promise(r => setTimeout(r, 500));
      }
      
      if (!mounted) return;

      // Initialize State
      setCredits(customerData?.credits ?? 0);
      setPlanStatus(customerData?.plan_status);
      
      if (customerData?.segment) {
        setSavedSegment(customerData.segment);
      }
      
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

      // Pre-fill URL if passed from landing page
      if (urlTarget) {
        setUrl(urlTarget);
      }

      // 7. Update Customer Segment (Source of Truth)
      if (urlSegment) {
        // Only provision segment if user doesn't have one yet in the DB
        if (!customerData?.segment) {
          // Use backend endpoint to bypass RLS issues and ensure persistence
          await fetch('/api/user/update-segment', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentSession.access_token}`
            },
            body: JSON.stringify({ segment: urlSegment })
          });
          if (mounted) setSavedSegment(urlSegment);
        }
      }
      
      // 8. Robust First Buy Detection
      // Trust the URL param from PaymentConfirmation OR the DB status
      const urlFirstBuy = searchParams.get('first_buy');
      
      if (urlNewCredit === 'true') {
        // If coming from purchase, strictly trust the URL param to avoid race conditions with webhook
        setIsFirstBuy(urlFirstBuy === 'true');
      } else if (customerData?.is_regular_user && !customerData?.is_power_user) {
        // Otherwise, rely on DB state
        setIsFirstBuy(true);
      }

      // 8. Clean URL (Once everything is processed)
      if (urlRef || urlSegment || urlNewCredit || urlCoupon || urlReferralClaim) {
        setSearchParams({}, { replace: true });
      }

      // 9. Check Notifications
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', currentSession.user.email)
        .eq('is_read', false);
      setHasUnreadNotifications(!!notifCount && notifCount > 0);
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [searchParams, setSearchParams, navigate, location]);

  // --- 2. REALTIME SUBSCRIPTION (Stable) ---
  useEffect(() => {
    if (!session?.user?.email) return;

    const channel = supabase
      .channel('customer-credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `email=eq.${session.user.email}`,
        },
        (payload) => {
          const newData = payload.new;
          if (newData.credits !== undefined) setCredits(newData.credits);
          if (newData.plan_status !== undefined) setPlanStatus(newData.plan_status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email]);

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
    setPerformanceResult(null);
    setError(null);

    // Determine final goal string
    let finalGoal = 'Quickly understand what this page is about.';
    if (taskType === 'purchase') finalGoal = 'Attempt to make a purchase or sign up, thinking aloud about the decision process.';

    // Ensure the URL has a protocol
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    const endpoint = deepAudit ? '/api/run-deep-audit' : '/api/run-test';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fullUrl, personaIds: selectedPersonas, goal: finalGoal, email: session?.user?.email }), 
      });

      if (response.status === 401) {
        throw { error: 'Session Expired', details: 'Please sign in again.' };
      }

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

      if (deepAudit) {
        // Deep Audit returns both performance data AND standard analysis
        setPerformanceResult(data.data.performance);
        setResult(data.data.analysis);
        setActiveResultTab('performance'); // Default to performance tab
      } else {
        // VALIDATION: Prevent "Blank Screen" crashes by ensuring data integrity
        if (!data.userSessions || !Array.isArray(data.userSessions) || data.userSessions.length === 0) {
           throw { error: 'Analysis Failed', details: 'The AI agent could not generate user sessions for this URL. It might be inaccessible.' };
        }
        if (!data.expertReport) {
           throw { error: 'Report Generation Failed', details: 'The AI agent failed to generate the expert report.' };
        }
        console.log('✅ Analysis Data Validated:', data); // Debugging
        setResult(data);
        setActiveResultTab('ux'); // Default to UX tab
      }
      
      // Optimistic update for gamification: Decrement credit counter visually
      if (credits !== null && credits > 0) {
        setCredits(credits - (deepAudit ? 9 : 1));
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
      let displayError = {
        error: err.error || 'An unknown error occurred.',
        details: err.details || 'Could not retrieve details.',
        usageCounted: err.usageCounted,
      };

      // Check for the specific AI failure case and show the user-friendly message
      if (displayError.details.includes('All fallback models failed') || displayError.details.includes('providers failed')) {
        displayError.error = 'AI Services Temporarily Unavailable';
        displayError.details = 'We are unable to connect to our AI models at the moment. Please try again in a few minutes. You have not been charged for this attempt.';
        displayError.usageCounted = false;
      }

      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setResult(null);
    setError(null);
    setPerformanceResult(null);
    setActiveResultTab('performance');
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
    const referralId = (window as any).promotekit_referral;
    console.log('🛒 Dashboard Checkout - Referral ID:', referralId);
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
    setShowRefillModal(true);
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
          /* Make the printable component and its children visible */
          .printable, .printable * { visibility: visible; }
          .printable { position: absolute; left: 0; top: 0; width: 100%; }
          
          /* Cover Page Styling - Compact for Print */
          .report-cover { margin-bottom: 1cm; page-break-after: avoid; }
          
          .no-print { display: none !important; }
          
          /* Ensure background colors and images print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Typography for Print */
          body { font-size: 12pt; line-height: 1.5; color: #000; background: white !important; }
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

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
      `}</style>

      <div className={`relative mx-auto transition-all duration-500 ${result ? 'max-w-7xl' : 'max-w-3xl'}`}>
        
        {/* --- BEFORE RESULTS: Vertical Widgets --- */}
        {!result && !error && (
          <div className="no-print lg:absolute lg:top-32 lg:-right-[160px] lg:w-32 mb-8 lg:mb-0 z-20 flex flex-col gap-4">
             
             {/* 1. Available Tests (Vertical) */}
             <div className="bg-black rounded-xl border-2 border-gray-800 shadow-lg overflow-hidden">
                <div className="p-5 text-center">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Available Credits</span>
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
                        title="Add Credits"
                      >
                        <PlusCircle size={28} />
                      </button>

                      {hasUnreadNotifications && (
                        <button 
                          onClick={async () => {
                            setHasUnreadNotifications(false); // Optimistic UI update
                            if (session?.access_token) {
                              await fetch('/api/user/notifications/mark-read', { 
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${session.access_token}` }
                              });
                            }
                            navigate('/account');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 border border-black hover:bg-red-600 transition-colors animate-bounce shadow-sm"
                          title="New Notification"
                        >
                          <Bell size={12} fill="currentColor" />
                        </button>
                      )}
                   </div>
                </div>
                
                <div className="bg-gray-900 p-3 border-t border-gray-800 text-center">
                  <p className="text-[10px] font-bold text-white leading-relaxed">
                    Low on Credits?{' '}
                    <button onClick={handleReplenish} className="underline hover:text-gray-300 transition-all">
                      Refill
                    </button>
                  </p>
                </div>
              </div>

              {/* Credit Note */}
              <p className="text-[10px] text-black text-center -mt-2 font-medium">* 3 credits = about 1 URL</p>

              {/* 2. Referral/Partner Card Logic */}
              {userSegment === 'tech' ? (
                // Tech Users see Partner Program (Affiliate)
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
              ) : (
                // SMB Users see Give 3 Get 3 (Referral)
                referralCode && (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl border-2 border-black shadow-lg overflow-hidden text-white animate-fade-in">
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2 text-2xl">🎁</div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 whitespace-nowrap">Give 3, Get 3</h3>
                    <p className="text-[10px] leading-tight mb-3 opacity-90">Share 3 free credits, get 3 free credits when they test their 1st URL.</p>
                    <button 
                      onClick={copyReferralLink}
                      className="w-full bg-white text-indigo-600 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors"
                    >
                      {copyButtonText === 'Link Copied!' ? null : <Copy size={12} />} {copyButtonText}
                    </button>
                  </div>
                </div>
                )
              )}
          </div>
        )}

      <div className="w-full">
      {!result && !performanceResult && !error && (
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

            {/* Deep Audit Toggle */}
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-black flex items-center gap-2"><BarChart size={20} /> Deep Performance Audit</h3>
                <p className="text-sm text-gray-600">Simulate a 4-year-old Android on 3G across 5 pages.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${deepAudit ? 'text-black' : 'text-gray-400'}`}>{deepAudit ? '9 Credits' : '3 Credits'}</span>
                <button type="button" onClick={() => setDeepAudit(!deepAudit)} className={`w-14 h-8 rounded-full p-1 transition-colors border-2 border-black ${deepAudit ? 'bg-green-500' : 'bg-gray-200'}`}><div className={`w-5 h-5 bg-white rounded-full border-2 border-black shadow-sm transition-transform ${deepAudit ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>
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

      {(result || performanceResult) && (
        <div className="no-print text-center mb-12 animate-fade-in max-w-3xl mx-auto">
           <h1 className="text-4xl font-black mb-2 text-black">Analysis Complete</h1>
           <p className="text-black font-medium text-lg">Review the user sessions and the aggregated research report below.</p>
           <button onClick={resetState} className="mt-6 mb-8 bg-black text-white font-bold py-3 px-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#fff] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
             Run Another Test
           </button>
           
           {/* --- AFTER RESULTS: Horizontal Widget --- */}
           <div className="bg-black text-white p-3 rounded-xl border-2 border-gray-800 shadow-lg flex items-center justify-between gap-4 max-w-md mx-auto mb-8">
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Credits</span>
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
                  <span className="text-xs text-gray-500">Includes Performance Audit, User Sessions & Expert Analysis</span>
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
                  <span className="text-xs text-gray-500">Performance Audit, Expert Analysis & Scores (Compact)</span>
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
            <NeoCard title="Refill Credits" className="relative">
              <button 
                onClick={() => setShowRefillModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
              >
                <X size={24} />
              </button>
              
              <p className="text-gray-600 mb-6 font-medium">Select a credit pack to continue testing immediately. <span className="text-xs text-gray-500 block mt-1">(3 credits = about 1 URL)</span></p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleCheckout('pack-3')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black rounded-xl hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <span className="font-bold text-lg text-black">9 Credits</span>
                  <span className="font-black text-xl text-black">$14</span>
                </button>

                <button 
                  onClick={() => handleCheckout('pack-15')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black bg-[#ff8c00] rounded-xl hover:bg-[#ffa500] transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="text-left">
                    <span className="block font-bold text-lg text-black">45 Credits</span>
                    <span className="text-xs text-black font-medium">Best Value</span>
                  </div>
                  <span className="font-black text-xl text-black">$69</span>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  Have your own AI API Keys and want infinite tests? <br/>
                  <button onClick={() => navigate('/waitlist')} className="text-indigo-600 font-bold hover:underline">Switch to our Agency plan</button>
                </p>
              </div>
            </NeoCard>
          </div>
        </div>
      )}

      {/* Result Tabs (Only show if we have both) */}
      {result && performanceResult && (
        <>
          {/* CTO FIX: Action Bar moved above tabs for better hierarchy */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
             <h2 className="text-2xl font-black text-black hidden md:block">Analysis Results</h2>
             <div className="flex gap-2 w-full md:w-auto justify-end">
                {result?.reportId && (
                  <a 
                    href={`/api/public-report/${result.reportId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="no-print"
                  >
                    <NeoButton variant="secondary" icon={<Share2 size={16} />}>Share</NeoButton>
                  </a>
                )}
                <NeoButton variant="secondary" onClick={handlePrintClick} className="no-print" icon={<Download size={16} />}>Download Report</NeoButton>
             </div>
          </div>

          <div className="w-full mb-10 no-print">
            <div className="grid grid-cols-2 gap-4 p-2 bg-black rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <button
              onClick={() => setActiveResultTab('performance')}
              className={`py-3 rounded-lg text-lg font-black uppercase tracking-wider transition-all ${
                activeResultTab === 'performance' 
                  ? 'bg-[#ff8c00] text-black shadow-[2px_2px_0px_0px_#fff] translate-x-[-1px] translate-y-[-1px]' 
                  : 'bg-gray-900 text-gray-500 hover:text-white'
              }`}
            >
              Performance Audit
            </button>
            <button
              onClick={() => setActiveResultTab('ux')}
              className={`py-3 rounded-lg text-lg font-black uppercase tracking-wider transition-all ${
                activeResultTab === 'ux' 
                  ? 'bg-[#ff1493] text-white shadow-[2px_2px_0px_0px_#fff] translate-x-[-1px] translate-y-[-1px]' 
                  : 'bg-gray-900 text-gray-500 hover:text-white'
              }`}
            >
              UX Analysis
            </button>
          </div>
        </div>
        </>
      )}

      {/* Wrapper for Print Visibility */}
      <PrintableComponent>

      {performanceResult && (activeResultTab === 'performance' || printMode === 'full') && (
        <div id="performance-report-wrapper" className={`animate-fade-in w-full ${activeResultTab !== 'performance' && !printMode ? 'hidden' : ''}`}>
          <PerformanceReport data={performanceResult} />
        </div>
      )}
      {result && (activeResultTab === 'ux' || !performanceResult || printMode === 'full') && (
        <div className={`animate-fade-in w-full ${printMode === 'summary' ? 'print-summary-only' : ''} ${activeResultTab !== 'ux' && performanceResult && !printMode ? 'hidden' : ''} ${performanceResult && printMode === 'full' ? 'page-break-before mt-8' : ''}`}>
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
                <div className="print-only mb-8">
                  <div className="bg-white p-4 mb-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] break-inside-avoid">
                    <h2 className="text-2xl font-black text-black m-0 no-border">Detailed User Sessions</h2>
                  </div>

                  {result.userSessions.map((res, idx) => {
                    const userSection = res.analysis || '';
                    const parts = userSection.split('|||USER_DETAILS|||') || ['', ''];
                    const details = parts[1] || 'No detailed feedback provided.';
                    const moodAndBubble = parts[0] || '';
                    const bubbleParts = moodAndBubble.split('|||USER_BUBBLE|||') || ['', ''];
                    const userBubble = bubbleParts[1]?.trim() || "I'm analyzing the page...";

                    return (
                      <div key={idx} className="user-session-print-item">
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
                  <div>
                    <h2 className="text-2xl font-bold text-black m-0">UX Research Report</h2>
                    <p className="text-sm text-gray-600 mt-1">This is a compiled report of all the persona's experiences.</p>
                  </div>
                </div>

                {/* Render Test Result First for Prominence */}
                <div className="prose max-w-none">
                  {formatText(result.expertReport.replace('|||SSL_WARNING_ALERT|||\n', '').split('\n').find(line => line.includes('TEST RESULT:')) || '')}
                </div>
                
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
      </PrintableComponent>

      {error && (
        error.error === 'Site Security Error' ? (
          <SecurityAlert isBlocking={true} onReset={resetState} />
        ) : error.error === 'Insufficient Credits' ? (
           <InsufficientCreditsCard onBuy={handleCheckout} onClose={resetState} />
        ) : error.error === 'Session Expired' ? (
           <SessionExpiredCard onLogin={() => navigate('/login')} />
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

      {/* Feedback Toast (Fixed Position) - Moved outside result check to appear immediately on load */}
      <FeedbackCard email={session?.user?.email} isFirstBuy={isFirstBuy} justPurchased={justPurchased} hasResult={!!result} />
      </div>
    </div>
    )}
    </div>
  );
};

export default AiPoweredUxHealthtech;
