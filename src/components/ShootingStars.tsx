import React from 'react';

interface ShootingStar {
  id: number;
  left: string;
  top: string;
  delay: number;
  duration: number;
}

interface ShootingStarsProps {
  count?: number;
}

const ShootingStars: React.FC<ShootingStarsProps> = ({ count = 5 }) => {
  const [stars, setStars] = React.useState<ShootingStar[]>([]);

  React.useEffect(() => {
    const generateStars = () => {
      const newStars: ShootingStar[] = [];
      for (let i = 0; i < count; i++) {
        newStars.push({
          id: i,
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          delay: Math.random() * 10, // Increased delay range for better distribution
          duration: 3 + Math.random() * 4 // Longer duration for more visible effect
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, [count]);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="shooting-star"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          >
            {/* Shooting Star */}
            <div className="star"></div>
            <div className="trail"></div>
          </div>
        ))}
      </div>

      <style>{`
        .shooting-star {
          position: absolute;
          animation: shoot linear infinite;
        }

        .star {
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
          animation: twinkle 0.5s ease-in-out infinite alternate;
        }

        .trail {
          position: absolute;
          top: 0;
          left: 0;
          width: 80px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8), transparent);
          transform-origin: 100% 50%;
          transform: rotate(-45deg);
          animation: trail-fade linear infinite;
        }

        @keyframes shoot {
          0% {
            transform: translateX(-100px) translateY(100px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(calc(-100vh - 100px));
            opacity: 0;
          }
        }

        @keyframes twinkle {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes trail-fade {
          0% {
            opacity: 0;
            transform: rotate(-45deg) translateX(0) scaleX(0);
          }
          20% {
            opacity: 0.8;
            transform: rotate(-45deg) translateX(-20px) scaleX(1);
          }
          100% {
            opacity: 0;
            transform: rotate(-45deg) translateX(-80px) scaleX(0);
          }
        }
      `}</style>
    </>
  );
};

export default ShootingStars;