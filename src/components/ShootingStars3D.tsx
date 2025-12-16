import React from 'react';

interface ShootingStar3D {
  id: number;
  left: string;
  top: string;
  delay: number;
  duration: number;
  depth: number;
  size: number;
}

interface ShootingStars3DProps {
  count?: number;
}

const ShootingStars3D: React.FC<ShootingStars3DProps> = ({ count = 8 }) => {
  const [stars, setStars] = React.useState<ShootingStar3D[]>([]);

  React.useEffect(() => {
    const generateStars = () => {
      const newStars: ShootingStar3D[] = [];
      for (let i = 0; i < count; i++) {
        newStars.push({
          id: i,
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          delay: Math.random() * 15,
          duration: 4 + Math.random() * 6,
          depth: Math.random() * 500 + 200, // Z-depth for 3D effect
          size: Math.random() * 2 + 1 // Size variation
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, [count]);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ perspective: '1000px' }}>
        {stars.map((star) => (
          <div
            key={star.id}
            className="shooting-star-3d"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              '--depth': `${star.depth}px`,
              '--size': `${star.size}px`
            } as React.CSSProperties}
          >
            {/* Multiple layers for 3D depth effect */}
            <div className="star-core"></div>
            <div className="star-glow"></div>
            <div className="star-trail"></div>
            <div className="star-particles"></div>
          </div>
        ))}
      </div>

      <style>{`
        .shooting-star-3d {
          position: absolute;
          animation: shoot-3d linear infinite;
          transform-style: preserve-3d;
        }

        .star-core {
          width: calc(var(--size) * 3px);
          height: calc(var(--size) * 3px);
          background: radial-gradient(circle, #ffffff 0%, #dbeafe 50%, #bfdbfe 100%);
          border-radius: 50%;
          box-shadow:
            0 0 calc(var(--size) * 8px) rgba(255, 255, 255, 0.8),
            0 0 calc(var(--size) * 16px) rgba(14, 165, 233, 0.5),
            0 0 calc(var(--size) * 24px) rgba(2, 132, 199, 0.3);
          animation: twinkle-3d 0.8s ease-in-out infinite alternate;
          transform: translateZ(calc(var(--depth) * 0.1px));
        }

        .star-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: calc(var(--size) * 20px);
          height: calc(var(--size) * 20px);
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(14, 165, 233, 0.25) 50%, transparent 100%);
          border-radius: 50%;
          transform: translate(-50%, -50%) translateZ(calc(var(--depth) * 0.05px));
          animation: pulse-3d 2s ease-in-out infinite;
        }

        .star-trail {
          position: absolute;
          top: 0;
          left: 0;
          width: calc(var(--size) * 120px);
          height: calc(var(--size) * 2px);
          background: linear-gradient(to right,
            transparent 0%,
            rgba(255, 255, 255, 0.9) 10%,
            rgba(14, 165, 233, 0.8) 30%,
            rgba(2, 132, 199, 0.6) 50%,
            rgba(14, 165, 233, 0.4) 70%,
            transparent 100%);
          transform-origin: 100% 50%;
          transform: rotate(-45deg) translateZ(calc(var(--depth) * 0.02px));
          animation: trail-fade-3d linear infinite;
        }

        .star-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: calc(var(--size) * 100px);
          height: calc(var(--size) * 100px);
          background:
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.5) 1px, transparent 1px),
            radial-gradient(circle at 40% 60%, rgba(2, 132, 199, 0.4) 1px, transparent 1px);
          background-size: calc(var(--size) * 20px) calc(var(--size) * 20px);
          transform: translateZ(calc(var(--depth) * 0.01px));
          animation: particles-float-3d 3s ease-in-out infinite;
        }

        @keyframes shoot-3d {
          0% {
            transform: translateX(-200px) translateY(200px) translateZ(var(--depth));
            opacity: 0;
          }
          5% {
            opacity: 0.3;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          95% {
            opacity: 0.3;
          }
          100% {
            transform: translateX(calc(100vw + 200px)) translateY(calc(-100vh - 200px)) translateZ(calc(var(--depth) * 0.5));
            opacity: 0;
          }
        }

        @keyframes twinkle-3d {
          0% {
            opacity: 0.4;
            transform: translateZ(calc(var(--depth) * 0.1px)) scale(0.8);
            filter: brightness(0.7);
          }
          100% {
            opacity: 1;
            transform: translateZ(calc(var(--depth) * 0.1px)) scale(1.3);
            filter: brightness(1.2);
          }
        }

        @keyframes pulse-3d {
          0%, 100% {
            opacity: 0.2;
            transform: translate(-50%, -50%) translateZ(calc(var(--depth) * 0.05px)) scale(0.8);
          }
          50% {
            opacity: 0.5;
            transform: translate(-50%, -50%) translateZ(calc(var(--depth) * 0.05px)) scale(1.2);
          }
        }

        @keyframes trail-fade-3d {
          0% {
            opacity: 0;
            transform: rotate(-45deg) translateX(0) scaleX(0) translateZ(calc(var(--depth) * 0.02px));
          }
          20% {
            opacity: 0.9;
            transform: rotate(-45deg) translateX(-30px) scaleX(1) translateZ(calc(var(--depth) * 0.02px));
          }
          80% {
            opacity: 0.7;
            transform: rotate(-45deg) translateX(-90px) scaleX(0.8) translateZ(calc(var(--depth) * 0.02px));
          }
          100% {
            opacity: 0;
            transform: rotate(-45deg) translateX(-120px) scaleX(0) translateZ(calc(var(--depth) * 0.02px));
          }
        }

        @keyframes particles-float-3d {
          0%, 100% {
            opacity: 0.3;
            transform: translateZ(calc(var(--depth) * 0.01px)) rotate(0deg);
          }
          50% {
            opacity: 0.7;
            transform: translateZ(calc(var(--depth) * 0.01px)) rotate(180deg);
          }
        }
      `}</style>
    </>
  );
};

export default ShootingStars3D;