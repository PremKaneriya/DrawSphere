'use client';

type Props = {
  position: [number, number];
  tool: string;
  color: string;
  size: number;
};

export default function CustomCursor({ position, tool, color, size }: Props) {
  const [x, y] = position;
  
  const getCursorJSX = () => {
    switch (tool) {
      case 'select':
        return (
          <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ width: '20px', height: '20px' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M4 4L12 12M4 4V10M4 4H10" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <rect
                  x="10"
                  y="10"
                  width="6"
                  height="6"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="rgba(79, 144, 242, 0.5)"
                />
              </svg>
            </div>
          </div>
        );
      
      case 'pen':
        return (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-white pointer-events-none"
            style={{ 
              left: x, 
              top: y, 
              width: `${size}px`, 
              height: `${size}px`,
              backgroundColor: color,
              opacity: 0.7
            }}
          />
        );
      
      case 'eraser':
        return (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-white pointer-events-none"
            style={{ 
              left: x, 
              top: y, 
              width: `${size}px`, 
              height: `${size}px`,
              backgroundColor: 'rgba(255,255,255,0.2)'
            }}
          />
        );
      
      case 'line':
        return (
          <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ width: '20px', height: '20px' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="2" y1="18" x2="18" y2="2" stroke={color} strokeWidth="2" />
              </svg>
            </div>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 border border-white rounded-full"
              style={{ 
                width: `${size}px`, 
                height: `${size}px`,
                opacity: 0.3
              }}
            />
          </div>
        );
      
      case 'circle':
        return (
          <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ width: '20px', height: '20px' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="2" />
              </svg>
            </div>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 border border-white rounded-full"
              style={{ 
                width: `${size}px`, 
                height: `${size}px`,
                opacity: 0.3
              }}
            />
          </div>
        );
      
      case 'rectangle':
        return (
          <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ width: '20px', height: '20px' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="16" height="16" stroke={color} strokeWidth="2" />
              </svg>
            </div>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 border border-white rounded-sm"
              style={{ 
                width: `${size}px`, 
                height: `${size}px`,
                opacity: 0.3
              }}
            />
          </div>
        );
      
      case 'text':
        return (
          <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ width: '20px', height: '20px' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="5" y="15" fill={color} fontWeight="bold" fontSize="16px">T</text>
              </svg>
            </div>
            <div 
              className="absolute h-4 w-px bg-white animate-blink"
              style={{ 
                left: '0px',
                top: '0px'
              }}
            />
          </div>
        );
        
      default:
        return (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white rounded-full pointer-events-none"
            style={{ left: x, top: y }}
          />
        );
    }
  };

  return getCursorJSX();
}