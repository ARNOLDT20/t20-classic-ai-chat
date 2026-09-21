import { Brain, Sparkles, Image, Code, Globe, MessageSquare, Search, Wand2 } from "lucide-react";

const WelcomeMessage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl rounded-full" />
        <Brain className="w-20 h-20 text-primary relative z-10 animate-pulse" />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text">
        Welcome to T20-CLASSIC AI
      </h1>
      
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Your intelligent assistant with web search, image generation, code writing, and multilingual support.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl w-full">
        <div className="glass-effect p-4 rounded-xl text-center hover:scale-105 transition-transform">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
          <span className="text-sm font-medium">Natural Chat</span>
        </div>
        <div className="glass-effect p-4 rounded-xl text-center hover:scale-105 transition-transform">
          <Search className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <span className="text-sm font-medium">Web Search</span>
        </div>
        <div className="glass-effect p-4 rounded-xl text-center hover:scale-105 transition-transform">
          <Wand2 className="w-8 h-8 mx-auto mb-2 text-accent" />
          <span className="text-sm font-medium">Generate Images</span>
        </div>
        <div className="glass-effect p-4 rounded-xl text-center hover:scale-105 transition-transform">
          <Image className="w-8 h-8 mx-auto mb-2 text-purple-400" />
          <span className="text-sm font-medium">Analyze Images</span>
        </div>
        <div className="glass-effect p-4 rounded-xl text-center hover:scale-105 transition-transform">
          <Code className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <span className="text-sm font-medium">Write Code</span>
        </div>
        <div className="glass-effect p-4 rounded-xl text-center hover:scale-105 transition-transform">
          <Globe className="w-8 h-8 mx-auto mb-2 text-blue-400" />
          <span className="text-sm font-medium">Multilingual</span>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        <span>Created by T20_STARBOY</span>
      </div>
    </div>
  );
};

export default WelcomeMessage;
