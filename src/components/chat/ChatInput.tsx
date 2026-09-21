import { useState, useRef } from "react";
import { Send, Image, Sparkles, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isRecording, isProcessing, toggleRecording } = useVoiceInput(
    (transcribedText) => {
      setMessage((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText));
    }
  );

  const compressImage = (file: File, maxWidth: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const canvas = document.createElement("canvas");
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          let { width, height } = img;
          
          // Scale down if larger than maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.8 quality
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow up to 20MB raw file
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be less than 20MB");
      return;
    }

    try {
      toast.info("Processing image...");
      const compressedImage = await compressImage(file);
      setSelectedImage(compressedImage);
      toast.success("Image ready");
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to process image");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && !disabled) {
      onSendMessage(message.trim(), selectedImage || undefined);
      setMessage("");
      setSelectedImage(null);
    }
  };

  const handleGenerateImage = () => {
    if (disabled) return;
    const prompt = message.trim() || "Generate a beautiful abstract art";
    onSendMessage(`Generate an image: ${prompt}`);
    setMessage("");
  };

  return (
    <div className="glass-effect border-t border-border p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {selectedImage && (
          <div className="relative inline-block mb-2">
            <img src={selectedImage} alt="Selected" className="max-h-32 rounded-lg" />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </Button>
          </div>
        )}
        <div className="flex gap-2 md:gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="h-12 w-12 md:h-14 md:w-14 glass-effect flex-shrink-0"
                >
                  <Image className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleGenerateImage}
                  disabled={disabled}
                  className="h-12 w-12 md:h-14 md:w-14 glass-effect flex-shrink-0 border-accent/50 hover:border-accent hover:bg-accent/10"
                >
                  <Sparkles className="w-5 h-5 text-accent" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate Image with AI</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={toggleRecording}
                  disabled={disabled || isProcessing}
                  className={cn(
                    "h-12 w-12 md:h-14 md:w-14 glass-effect flex-shrink-0 transition-all",
                    isRecording && "border-red-500 bg-red-500/20 animate-pulse"
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-5 h-5 text-red-500" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isProcessing
                  ? "Processing..."
                  : isRecording
                  ? "Stop Recording"
                  : "Voice Input"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isRecording
                ? "Recording... Click mic to stop"
                : "Ask T20-CLASSIC AI anything..."
            }
            className="flex-1 min-h-[48px] md:min-h-[56px] max-h-[200px] resize-none bg-secondary/70 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={disabled || isRecording}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={disabled || (!message.trim() && !selectedImage) || isRecording}
            size="icon"
            className="h-12 w-12 md:h-14 md:w-14 bg-gradient-to-br from-primary to-accent hover:shadow-lg transition-all hover:-translate-y-0.5 flex-shrink-0"
            style={{ boxShadow: "var(--glow-primary)" }}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
