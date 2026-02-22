import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, X, Map } from 'lucide-react';

const OnboardingTour = ({ steps = [], onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
            {/* Spotlight overlay */}
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', pointerEvents: 'all', zIndex: 9998 }} onClick={onClose} />

            {/* Tour card */}
            <div className="onboarding-tooltip animate-slide-up" style={{
                position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 9999, pointerEvents: 'all', width: '420px', maxWidth: 'calc(100vw - 40px)',
            }}>
                {/* Progress */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i <= currentStep ? '#3b82f6' : 'rgba(255,255,255,0.2)', transition: 'background 0.3s' }} />
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Map size={18} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System Guide — Step {currentStep + 1} of {steps.length}</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>{step.title}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>

                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '20px' }}>{step.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        onClick={() => setCurrentStep(s => s - 1)}
                        disabled={currentStep === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 16px', color: 'rgba(255,255,255,0.8)', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: currentStep === 0 ? 0.4 : 1 }}
                    >
                        <ChevronLeft size={14} /> Back
                    </button>

                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>
                        Skip tour
                    </button>

                    {isLast ? (
                        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '8px 20px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                            🎉 Let's Go!
                        </button>
                    ) : (
                        <button onClick={() => setCurrentStep(s => s + 1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '8px 20px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                            Next <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
