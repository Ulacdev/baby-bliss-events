



const Background3D = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`absolute w-4 h-4 rounded-full opacity-20 animate-float3d`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#ff69b4', '#87ceeb', '#ffb6c1', '#dda0dd'][i % 4],
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${4 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

export default Background3D;