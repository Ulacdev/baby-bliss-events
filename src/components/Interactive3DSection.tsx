const Interactive3DSection = () => {
  return (
    <div className="w-full h-64 canvas-container bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 rounded-3xl relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 bg-blue-500 rounded-full animate-float3d opacity-80" />
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-300 rounded-lg animate-float3d opacity-70" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-purple-300 rounded-full animate-float3d opacity-60" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </div>
  );
};

export default Interactive3DSection;