import React from 'react';
import { Construction, Clock, Sparkles, ArrowLeft } from 'lucide-react';

interface PendingScreenProps {
  title: string;
  description?: string;
  category?: string;
  onBack?: () => void;
}

export function PendingScreen({ title, description, category, onBack }: PendingScreenProps) {
  return (
    <div 
      style={{ 
        width: '100%', 
        minHeight: 'calc(100vh - 120px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FAFBFC 0%, #F9FAFB 100%)',
        padding: '40px',
        position: 'relative'
      }}
    >
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            color: '#6B7280',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.color = '#1F2937';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      )}

      <div 
        style={{
          maxWidth: '600px',
          width: '100%',
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB'
        }}
      >
        {/* Icon */}
        <div 
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            position: 'relative'
          }}
        >
          <Construction 
            size={36} 
            style={{ 
              color: '#60A5FA',
              animation: 'float 3s ease-in-out infinite'
            }} 
          />
          <div 
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '16px',
              height: '16px',
              background: '#34D399',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={10} color="white" />
          </div>
        </div>

        {/* Category Badge */}
        {category && (
          <div 
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: '#EFF6FF',
              color: '#60A5FA',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '12px',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {category}
          </div>
        )}

        {/* Title */}
        <h2 
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '12px',
            lineHeight: '1.2'
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p 
          style={{
            fontSize: '16px',
            color: '#6B7280',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}
        >
          {description || 'This feature is currently under development and will be available soon.'}
        </p>

        {/* Status Section */}
        <div 
          style={{
            background: '#F9FAFB',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '32px'
          }}
        >
          <div className="flex items-center justify-center" style={{ gap: '8px', marginBottom: '12px' }}>
            <Clock size={16} style={{ color: '#60A5FA' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
              Development Status
            </span>
          </div>
          <div 
            style={{
              width: '100%',
              height: '8px',
              background: '#E5E7EB',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}
          >
            <div 
              style={{
                width: '35%',
                height: '100%',
                background: 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)',
                borderRadius: '4px',
                animation: 'progress 2s ease-in-out infinite'
              }}
            />
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            In progress • Expected Q1 2025
          </p>
        </div>

        {/* Features Coming */}
        <div 
          style={{
            textAlign: 'left',
            marginBottom: '32px'
          }}
        >
          <h3 
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            What's Coming
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Advanced filtering and search',
              'Real-time collaboration',
              'Smart notifications',
              'Export and reporting'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center" style={{ gap: '8px' }}>
                <div 
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#60A5FA'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          style={{
            width: '100%',
            height: '44px',
            background: '#60A5FA',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#3B82F6'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#60A5FA'}
        >
          Notify Me When Ready
        </button>

        {/* Footer Note */}
        <p 
          style={{
            fontSize: '12px',
            color: '#9CA3AF',
            marginTop: '24px'
          }}
        >
          Have feedback or suggestions? <a href="#" style={{ color: '#60A5FA', textDecoration: 'none' }}>Let us know →</a>
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}