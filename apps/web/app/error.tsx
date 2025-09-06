"use client";

import * as React from "react";
import { useToast } from "@/components/ui/use-toast";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { toast } = useToast();

  React.useEffect(() => {
    toast({
      title: "Something went wrong",
      description: error.message || "An unexpected error occurred.",
      variant: "destructive",
    });
  }, [error, toast]);

  return (
    <html>
      <body>
        <div className="mx-auto max-w-md py-24 text-center">
          <h2 className="text-xl font-semibold mb-2">We hit a snag</h2>
          <p className="text-sm text-gray-600 mb-6">{error.message || "An unexpected error occurred."}</p>
          <button className="px-3 py-2 border rounded" onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}


