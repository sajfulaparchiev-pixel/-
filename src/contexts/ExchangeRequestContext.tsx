import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Check, X, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import UserAvatar from "@/components/profile/UserAvatar";

interface ExchangeRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  skillTitle: string;
  skillId: string;
}

interface ExchangeRequestContextType {
  sendLiveRequest: (request: ExchangeRequest) => void;
}

const ExchangeRequestContext = createContext<ExchangeRequestContextType | undefined>(undefined);

export const useExchangeRequest = () => {
  const context = useContext(ExchangeRequestContext);
  if (!context) throw new Error("useExchangeRequest must be used within ExchangeRequestProvider");
  return context;
};

export const ExchangeRequestProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomingRequest, setIncomingRequest] = useState<ExchangeRequest | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`user-exchange-requests-${user.id}`);

    channel.on("broadcast", { event: "exchange-offered" }, (payload) => {
      setIncomingRequest(payload.payload);
    });

    channel.on("broadcast", { event: "exchange-accepted" }, (payload) => {
      toast.success(`${payload.payload.fromUserName} принял ваш запрос на обмен!`);
      navigate(`/user/${payload.payload.fromUserId}`);
    });

    channel.on("broadcast", { event: "exchange-declined" }, () => {
      toast.error("Запрос на обмен отклонен");
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const sendLiveRequest = (request: ExchangeRequest) => {
    // We target the recipient's channel
    supabase.channel(`user-exchange-requests-${request.id}`).send({
      type: "broadcast",
      event: "exchange-offered",
      payload: {
        ...request,
        id: user?.id, // Our ID for their list
      }
    });
  };

  const handleAccept = async () => {
    if (!incomingRequest || !user) return;

    try {
      toast.success("Обмен принят!");
      const targetId = incomingRequest.fromUserId;
      setIncomingRequest(null);
      
      // Notify back that it was accepted
      supabase.channel(`user-exchange-requests-${targetId}`).send({
        type: "broadcast",
        event: "exchange-accepted",
        payload: { fromUserId: user.id, fromUserName: user.user_metadata?.name || "Пользователь" }
      });

      // Transfer to the profile of the person who sent it
      navigate(`/user/${targetId}`);
    } catch (error) {
      toast.error("Ошибка при принятии обмена");
    }
  };

  const handleDecline = () => {
    if (!incomingRequest) return;
    
    // Notify back that it was declined
    supabase.channel(`user-exchange-requests-${incomingRequest.fromUserId}`).send({
      type: "broadcast",
      event: "exchange-declined",
      payload: { fromUserId: user?.id }
    });
    
    setIncomingRequest(null);
  };

  return (
    <ExchangeRequestContext.Provider value={{ sendLiveRequest }}>
      {children}
      
      <Dialog open={!!incomingRequest} onOpenChange={(open) => !open && handleDecline()}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader className="items-center text-center pb-2">
            <DialogTitle>Входящий запрос на обмен</DialogTitle>
             <div className="mb-4 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                <UserAvatar 
                  avatarId={incomingRequest?.fromUserAvatar}
                  userInitials={incomingRequest?.fromUserName.slice(0, 2).toUpperCase() || "??"}
                  size="h-24 w-24"
                  textSize="text-2xl"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-2 border-4 border-background">
                  <Phone className="w-4 h-4 text-white" />
                </div>
             </div>
            <DialogTitle className="text-2xl font-bold">Запрос на обмен!</DialogTitle>
            <DialogDescription className="text-[15px] pt-1 leading-relaxed">
              <span className="font-bold text-foreground">{incomingRequest?.fromUserName}</span> хочет предложить вам обменяться навыком:
            </DialogDescription>
          </DialogHeader>

          <div className="bg-secondary/40 p-4 rounded-2xl flex items-center gap-4 border border-border/50 my-4">
             <div className="flex-1">
               <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-bold text-[10px]">Навык</p>
               <p className="font-bold text-lg leading-tight">{incomingRequest?.skillTitle}</p>
             </div>
             <Check className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>

          <DialogFooter className="flex-row gap-3 sm:justify-center pt-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={handleDecline}>
              <X className="w-4 h-4 mr-2" />
              Отклонить
            </Button>
            <Button variant="hero" className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleAccept}>
              <Check className="w-4 h-4 mr-2" />
              Принять
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExchangeRequestContext.Provider>
  );
};
