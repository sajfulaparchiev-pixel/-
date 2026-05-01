import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CallContextType {
  initiateCall: (recipientId: string, recipientName: string, withVideo: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  const [callState, setCallState] = useState<"idle" | "calling" | "ringing" | "connected">("idle");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<{ offer?: RTCSessionDescriptionInit, channel?: ReturnType<typeof supabase.channel> } | null>(null);

  // Attach streams to video/audio elements safely
  const attachStreams = useCallback(() => {
    if (localVideoRef.current && localStream.current && localVideoRef.current.srcObject !== localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
    if (remoteVideoRef.current && remoteStream.current && remoteVideoRef.current.srcObject !== remoteStream.current) {
      remoteVideoRef.current.srcObject = remoteStream.current;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Listen for incoming calls on a user-specific broadcast channel
    const channel = supabase.channel(`user-calls-${user.id}`);
    
    channel.on("broadcast", { event: "call-offer" }, async (payload) => {
      if (callState !== "idle") {
        // Already in a call, reject
        supabase.channel(`user-calls-${payload.payload.callerId}`).send({
          type: "broadcast",
          event: "call-rejected",
          payload: { reason: "busy" }
        });
        return;
      }
      
      setPartnerId(payload.payload.callerId);
      setPartnerName(payload.payload.callerName);
      setIsVideo(payload.payload.withVideo);
      setCallState("ringing");
      
      // Store the offer to be used when accepted
      channelRef.current = { offer: payload.payload.offer };
    });

    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, callState]);

  const setupMedia = async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      toast.error("Не удалось получить доступ к камере или микрофону");
      return null;
    }
  };

  const createPeerConnection = (partner: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    pc.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      attachStreams();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        supabase.channel(`user-calls-${partner}`).send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { callerId: user?.id, candidate: event.candidate }
        });
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const initiateCall = async (recipientId: string, name: string, withVideo: boolean) => {
    if (!user) return;
    setPartnerId(recipientId);
    setPartnerName(name);
    setIsVideo(withVideo);
    setCallState("calling");
    
    // Subscribe to responses
    const callChannel = supabase.channel(`user-calls-${user.id}`);
    
    const stream = await setupMedia(withVideo);
    if (!stream) {
      endCall();
      return;
    }

    const pc = createPeerConnection(recipientId);
    
    callChannel.on("broadcast", { event: "call-answer" }, async (payload) => {
      if (payload.payload.callerId === recipientId && peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
        setCallState("connected");
      }
    });

    callChannel.on("broadcast", { event: "call-rejected" }, () => {
      toast.error("Вызов отклонен");
      endCall();
    });

    callChannel.on("broadcast", { event: "ice-candidate" }, async (payload) => {
      if (payload.payload.callerId === recipientId && peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    callChannel.on("broadcast", { event: "call-ended" }, () => {
      endCall();
    });

    callChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        supabase.channel(`user-calls-${recipientId}`).send({
          type: "broadcast",
          event: "call-offer",
          payload: { 
            callerId: user.id, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callerName: (user.user_metadata as any)?.user_name || user.email?.split("@")[0] || "Пользователь",
            withVideo,
            offer 
          }
        });
      }
    });
    
    channelRef.current = { channel: callChannel };
  };

  const acceptCall = async () => {
    const offer = channelRef.current?.offer;
    if (!user || !partnerId || !offer) return;

    const stream = await setupMedia(isVideo);
    if (!stream) {
      rejectCall();
      return;
    }

    const pc = createPeerConnection(partnerId);
    
    // Setup listeners for ice candidates and ending
    const callChannel = supabase.channel(`user-calls-${user.id}`);
    callChannel.on("broadcast", { event: "ice-candidate" }, async (payload) => {
      if (payload.payload.callerId === partnerId && peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
        } catch (e) {
          console.error(e);
        }
      }
    });
    callChannel.on("broadcast", { event: "call-ended" }, () => endCall());
    callChannel.subscribe();

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    supabase.channel(`user-calls-${partnerId}`).send({
      type: "broadcast",
      event: "call-answer",
      payload: { callerId: user.id, answer }
    });

    setCallState("connected");
  };

  const rejectCall = () => {
    if (partnerId) {
      supabase.channel(`user-calls-${partnerId}`).send({
        type: "broadcast",
        event: "call-rejected",
        payload: { callerId: user?.id }
      });
    }
    endCall();
  };

  const endCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (partnerId) {
      supabase.channel(`user-calls-${partnerId}`).send({
        type: "broadcast",
        event: "call-ended",
        payload: { callerId: user?.id }
      });
    }
    setCallState("idle");
    setPartnerId(null);
    setPartnerName("");
    channelRef.current = null;
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(t => t.enabled = isVideoMuted);
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Re-attach streams to refs when state changes
  useEffect(() => {
    if (callState === "connected" || callState === "calling") {
      attachStreams();
    }
  }, [callState, attachStreams]);

  const bindLocalVideo = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node) attachStreams();
  }, [attachStreams]);

  const bindRemoteVideo = useCallback((node: HTMLVideoElement | HTMLAudioElement | null) => {
    remoteVideoRef.current = node;
    if (node) attachStreams();
  }, [attachStreams]);

  return (
    <CallContext.Provider value={{ initiateCall }}>
      {children}
      
      {/* Incoming Call Dialog */}
      <Dialog open={callState === "ringing"} onOpenChange={(open) => !open && rejectCall()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl">Входящий {isVideo ? "видеозвонок" : "звонок"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 gap-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Phone className="w-12 h-12 text-primary" />
            </div>
            <p className="text-lg font-medium text-center">{partnerName} звонит вам...</p>
            <div className="flex gap-4 mt-4">
              <Button variant="destructive" size="lg" className="rounded-full w-14 h-14 p-0" onClick={rejectCall}>
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button variant="default" size="lg" className="rounded-full w-14 h-14 p-0 bg-emerald-500 hover:bg-emerald-600" onClick={acceptCall}>
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active / Outgoing Call Dialog */}
      <Dialog open={callState === "calling" || callState === "connected"} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black text-white border-border/20 h-[80vh] flex flex-col">
          <div className="p-4 bg-black/40 backdrop-blur-md absolute top-0 w-full z-10 flex justify-between items-center">
            <div>
              <p className="font-medium text-lg text-white">{partnerName}</p>
              <p className="text-sm text-white/70">
                {callState === "calling" ? "Звоним..." : "Идет разговор"}
              </p>
            </div>
          </div>
          
          <div className="flex-1 relative bg-zinc-900 flex items-center justify-center">
             {isVideo ? (
               <>
                 <video 
                   ref={bindRemoteVideo} 
                   autoPlay 
                   playsInline 
                   className="w-full h-full object-cover" 
                 />
                 <video 
                   ref={bindLocalVideo} 
                   autoPlay 
                   playsInline 
                   muted 
                   className="w-32 h-48 bg-black object-cover absolute bottom-24 right-4 rounded-xl border border-white/20 shadow-xl" 
                 />
               </>
             ) : (
               <div className="flex flex-col items-center gap-4">
                 <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(var(--primary),0.3)]">
                   <Phone className="w-12 h-12 text-primary" />
                 </div>
                 <audio ref={bindRemoteVideo} autoPlay playsInline />
               </div>
             )}
          </div>
          
          <div className="p-6 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full flex justify-center gap-6 z-10">
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full w-14 h-14 border-white/20 hover:bg-white/10 ${isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50" : "bg-black/40 text-white"}`}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            {isVideo && (
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full w-14 h-14 border-white/20 hover:bg-white/10 ${isVideoMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50" : "bg-black/40 text-white"}`}
                onClick={toggleVideo}
              >
                {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </Button>
            )}
            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full w-14 h-14 ml-4 shadow-lg shadow-red-500/20"
              onClick={endCall}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CallContext.Provider>
  );
};
