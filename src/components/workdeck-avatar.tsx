import React from 'react';

export interface WorkdeckAvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 24 | 32 | 40 | 48 | 64;
  status?: 'online' | 'away' | 'offline';
  className?: string;
}

export function WorkdeckAvatar({ 
  src, 
  alt, 
  name, 
  size = 40, 
  status,
  className = '' 
}: WorkdeckAvatarProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const getBackgroundColor = (name: string) => {
    const colors = [
      '#0066FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const statusColors = {
    online: '#10B981',
    away: '#F59E0B',
    offline: '#6B7280'
  };
  
  const statusSize = size <= 32 ? 'w-2 h-2' : 'w-2.5 h-2.5';
  
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img 
          src={src} 
          alt={alt || name || 'Avatar'} 
          className="w-full h-full rounded-full object-cover border-2 border-white"
        />
      ) : (
        <div 
          className="w-full h-full rounded-full flex items-center justify-center text-white font-medium border-2 border-white"
          style={{ 
            backgroundColor: name ? getBackgroundColor(name) : '#6B7280',
            fontSize: size <= 32 ? '10px' : size <= 48 ? '14px' : '18px'
          }}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {status && (
        <span 
          className={`absolute bottom-0 right-0 ${statusSize} rounded-full border-2 border-white`}
          style={{ backgroundColor: statusColors[status] }}
        />
      )}
    </div>
  );
}

export interface WorkdeckAvatarGroupProps {
  avatars: Array<{ src?: string; name?: string; alt?: string }>;
  max?: number;
  size?: 24 | 32 | 40 | 48 | 64;
  className?: string;
}

export function WorkdeckAvatarGroup({ avatars, max = 5, size = 40, className = '' }: WorkdeckAvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;
  
  return (
    <div className={`flex items-center ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div 
          key={index} 
          className="-ml-2 first:ml-0"
          style={{ zIndex: displayAvatars.length - index }}
        >
          <WorkdeckAvatar {...avatar} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div 
          className="-ml-2 rounded-full bg-[var(--gray-200)] flex items-center justify-center text-[var(--gray-600)] font-medium border-2 border-white"
          style={{ 
            width: size, 
            height: size,
            fontSize: size <= 32 ? '10px' : size <= 48 ? '12px' : '14px',
            zIndex: 0
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
