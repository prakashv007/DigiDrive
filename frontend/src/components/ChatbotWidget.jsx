import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Send, Mail, ChevronRight } from 'lucide-react';

const FAQ = [
    { q: 'How do I upload files?', a: 'Drag-and-drop files onto the upload zone on the My Files page, or click the zone to browse. Max 100 MB per file, all types supported.' },
    { q: 'How do private folders work?', a: 'Private folders are only visible to you and admins. Click "New Folder", toggle the 🔒 Private option, then upload files into it.' },
    { q: 'What is file versioning?', a: 'Upload a file with the same name to the same folder and a new version is created automatically. Click the 🕐 icon on a file to view the full timeline.' },
    { q: 'Why is my account locked?', a: 'Accounts lock after 30 days of inactivity, or if manually locked by an admin. Contact your IT administrator to unlock your account.' },
    { q: 'What is the Ransomware Shield?', a: 'It monitors for unusual deletion spikes and access violations in real-time. Admins see the current threat level (LOW/MEDIUM/HIGH) in the Security panel.' },
    { q: 'How do I join a project?', a: 'Projects are assigned by admins. Once assigned, the project appears automatically in your "Assigned Projects" section — no action needed from you.' },
    { q: 'Can I restore deleted files?', a: 'Deleted files are soft-deleted and retained temporarily. Contact your admin to restore them before they are permanently purged.' },
    { q: 'How do I change my password?', a: 'Password changes must be done by an admin. Contact your IT administrator to reset your credentials.' },
];

const getResponse = (text) => {
    const t = text.toLowerCase();
    const match = FAQ.find(f =>
        f.q.toLowerCase().split(' ').filter(w => w.length > 3).some(w => t.includes(w)) ||
        t.includes(f.q.toLowerCase().slice(0, 15))
    );
    if (match) return match.a;
    if (/hi|hello|hey/.test(t)) return '👋 Hello! How can I help you with DigiDrive today?';
    if (/thank/.test(t)) return "You're welcome! 🙌 Anything else I can help with?";
    if (/email|contact|support/.test(t)) return '📧 You can reach IT support at it-support@digidrive.com — Mon–Fri, 9 AM – 6 PM IST.';
    return "I'm not sure about that. Try clicking one of the quick questions below, or email us at it-support@digidrive.com.";
};

const HelplineWidget = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'agent', text: "👋 Hi! I'm the **DigiDrive Help Desk**.\n\nAsk me anything or pick a quick question below." }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [showFAQ, setShowFAQ] = useState(true);
    const endRef = useRef(null);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const send = (text) => {
        const t = typeof text === 'string' ? text : input.trim();
        if (!t) return;
        setInput('');
        // setShowFAQ(false); // Keep FAQ visible for continuous interaction
        setMessages(m => [...m, { from: 'user', text: t }]);
        setTyping(true);
        setTimeout(() => {
            setMessages(m => [...m, { from: 'agent', text: getResponse(t) }]);
            setTyping(false);
        }, 650);
    };

    const reset = () => {
        setMessages([{ from: 'agent', text: "👋 Hi! I'm the **DigiDrive Help Desk**.\n\nAsk me anything or pick a quick question below." }]);
        setShowFAQ(true);
        setInput('');
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
            {open && (
                <div className="chatbot-container">
                    {/* Header */}
                    <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #1d4ed8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <HelpCircle size={18} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>Help Desk</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                    Online
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={reset} title="New chat" style={{ background: 'transparent', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
                            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-body">
                        {messages.map((msg, i) => (
                            <div key={i} className={`chat-msg ${msg.from}`}>
                                {msg.text.split('\n').map((line, j) => {
                                    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                    return <div key={j} dangerouslySetInnerHTML={{ __html: html || '<br/>' }} />;
                                })}
                            </div>
                        ))}

                        {typing && (
                            <div className="chat-msg agent" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', animation: `bounce 1s ease ${i * 0.15}s infinite` }} />
                                ))}
                            </div>
                        )}

                        {/* FAQ Quick Chips */}
                        {showFAQ && !typing && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', padding: '0 8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '10px', alignSelf: 'center', border: '1px solid var(--border-color)' }}>Quick Questions</div>
                                {FAQ.slice(0, 4).map((f, i) => (
                                    <button key={i} onClick={() => send(f.q)} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                                        padding: '10px 14px', background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)', borderRadius: '20px',
                                        color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', textAlign: 'left',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        <span>{f.q}</span>
                                        <ChevronRight size={14} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={endRef} />
                    </div>

                    {/* Input */}
                    <div className="chat-footer">
                        <input
                            className="chat-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            placeholder="Type a message..."
                        />
                        <button onClick={() => send()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
                            <Send size={18} color="#fff" style={{ marginLeft: '2px' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle FAB */}
            <button
                onClick={() => setOpen(v => !v)}
                title="Help Desk"
                style={{
                    width: '54px', height: '54px', borderRadius: '50%',
                    background: open ? '#1e3a8a' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 28px rgba(99,102,241,0.45)',
                    transition: 'all 0.2s ease', transform: open ? 'scale(0.92)' : 'scale(1)',
                    position: 'relative',
                }}
            >
                {open ? <X size={22} color="#fff" /> : <HelpCircle size={24} color="#fff" />}
                {!open && (
                    <span style={{
                        position: 'absolute', top: '-3px', right: '-3px',
                        background: '#10b981', color: '#fff', borderRadius: '99px',
                        fontSize: '8px', fontWeight: '800', padding: '2px 5px',
                        border: '2px solid var(--bg-main, #0f1117)', lineHeight: '1.2',
                    }}>HELP</span>
                )}
            </button>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}</style>
        </div>
    );
};

export default HelplineWidget;
