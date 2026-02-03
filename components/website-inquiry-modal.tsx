"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WebsiteInquiryForm } from "@/components/website-inquiry-form";
import { cn } from "@/lib/utils";

interface WebsiteInquiryModalProps {
  children: React.ReactNode;
}

export function WebsiteInquiryModal({ children }: WebsiteInquiryModalProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogPortal>
        <DialogPrimitive.Backdrop
          className={cn(
            "data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/95 backdrop-blur-sm duration-500 data-closed:animate-out data-open:animate-in"
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-50 data-open:zoom-in-100 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-transparent p-0 text-sm outline-none duration-500 ease-out data-closed:animate-out data-open:animate-in sm:max-w-md"
          )}
        >
          <div className="p-6 text-white">
            <DialogHeader>
              <div className="data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 mb-2 flex justify-start data-[state=open]:animate-in data-[state=open]:duration-300">
                <Image
                  alt="the cloud"
                  height={48}
                  src="/thecloud(light).png"
                  width={200}
                />
              </div>
              <DialogTitle className="data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 mb-2 font-bold text-2xl text-white data-[state=open]:animate-in data-[state=open]:delay-150 data-[state=open]:duration-300">
                Want a website?
              </DialogTitle>
              <p className="data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 mb-4 text-lg text-white/80 data-[state=open]:animate-in data-[state=open]:delay-200 data-[state=open]:duration-300">
                Increase Lead Gen, Sales, and Scale Systems.
              </p>
            </DialogHeader>
            <div className="data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:animate-in data-[state=open]:delay-300 data-[state=open]:duration-300">
              <WebsiteInquiryForm onSuccess={handleSuccess} />
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
