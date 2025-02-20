"use client";

import { useWindowEvent } from "@mantine/hooks";
import { useEffect } from "react";
import { useFormFields } from "./form-fields";
import { MESSAGE_TYPES } from "./constants";

export default function AppToExtensionComponent() {
  const { setFormFields } = useFormFields();

  // Tell extension to scan form
  useEffect(() => {
    window.parent.postMessage({ type: MESSAGE_TYPES.SCAN_FORM_ELEMENTS }, "*");
  }, []);

  useWindowEvent(
    "message",
    (event: MessageEvent<{ type: "string"; data: string }>) => {
      // Always check the origin of the message for security reasons
      // if (event.origin !== "") {
      //   return; // Ignore the message if it's from an unexpected origin
      // }

      // Handle the message from the extension
      if (event.data.type === MESSAGE_TYPES.SCANNED_FORM_ELEMENTS) {
        const receivedData = event.data.data; // This is the data passed from the extension
        console.log("[TALIA] Received data:", JSON.parse(receivedData));
        setFormFields(JSON.parse(receivedData));
      }
    }
  );
  return <></>;
}
