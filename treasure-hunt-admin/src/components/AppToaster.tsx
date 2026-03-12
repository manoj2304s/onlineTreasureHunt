"use client";

import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "12px",
          border: "1px solid #2f4c3d",
          background: "#13231c",
          color: "#e6ffe7",
          boxShadow: "0 16px 32px -20px rgba(0, 0, 0, 0.75)",
        },
      }}
    />
  );
}
