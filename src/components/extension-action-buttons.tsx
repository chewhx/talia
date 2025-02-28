"use client";

import { useWindowEvent } from "@mantine/hooks";
import { useState } from "react";
import { TALIA_EVENTS } from "../../shared/constants";
import { Button, Container, Flex } from "@mantine/core";
import { mockAnnouncement } from "@/schema/announcementDraft.schema";
import { mockForm } from "@/schema/formDraft.schema";

export const ExtensionActionButton = () => {
  const [draftInfo, setDraftInfo] = useState<{} | null>(null);
  const [mockData, setMockData] = useState<string>("mock-data");
  const chromeExtensionID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;

  useWindowEvent("message", ({ data, origin }: MessageEvent) => {
    // const allowedDomain = [chromeExtensionID];

    // Only get response through chrome extension (panel.js or background.js)
    // if (!allowedDomain.includes(origin)) {
    //   return;
    // }

    switch (data.action) {
      // For SLS/Classroom
      // Listen the field attributes (id, name, etc)
      case TALIA_EVENTS.listeners.SCAN_FORM_RESPONSE: {
        const receivedData = JSON.parse(data?.result ?? {});
        console.log("🟢 HeyTalia: SCAN_FORM_RESPONSE", receivedData);

        let mockData = [];
        if (data?.currentWebsite === "SLS") {
          mockData = receivedData.map((field: any) => {
            const id = field?.id;

            if (field.category === "title") {
              return { id, value: "mock-title" };
            } else if (field.category === "start-date") {
              return { id, value: "25 Feb 2025" };
            } else if (field.category === "start-time") {
              return { id, value: "10:30" };
            } else if (field.category === "message") {
              return { id, value: "<b>mock-</b>message" };
            }

            return {
              id: field.id,
              value: "mock-" + (field?.attributes?.placeholder ?? "data"),
            };
          });
          setMockData(JSON.stringify(mockData));
        } else if (data?.currentWebsite === "GoogleClassroom") {
          // Pending
          setMockData("google-classroom");
        }

        break;
      }

      // For PG only
      // Listen the create draft response
      case TALIA_EVENTS.listeners.PG_DRAFT_RESPONSE: {
        const receivedData = data.result ?? {};
        console.log("🟢 HeyTalia: PG_DRAFT_RESPONSE", receivedData);
        if (receivedData?.announcementDraftId) {
          setDraftInfo({
            id: receivedData.announcementDraftId,
            type: "announcements",
          });
        } else if (receivedData?.consentFormDraftId) {
          setDraftInfo({
            id: receivedData.consentFormDraftId,
            type: "consentForms",
          });
        }

        break;
      }

      case TALIA_EVENTS.listeners.PG_UNAUTHORIZED: {
        console.log("🟢 HeyTalia: PG_UNAUTHORIZED");
        break;
      }
    }
  });

  // For SLS, GoogleClassroom, FormSG, etc
  // Send request to extension to scan form field
  // Action name: "SCAN_FORM_REQUEST"
  const scanFormFields = () => {
    sendMessageToExtension({ action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST });
  };

  // For SLS, GoogleClassroom, FormSG, etc
  // Send request to extension, extension will fill in field in the active tab (SLS/Classroom)
  // action: "FILL_FORM_REQUEST"
  // data:
  //    SLS: refer to studentLearningSpace.schema.ts > StudentLearningSpacePrefillSchema
  //    classroom: refer to googleClassroom.schema.ts
  const fillForm = () => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.FILL_FORM_REQUEST,
      data: mockData,
    });
  };

  // For PG only
  // Send request to extension, extension will send request create draft to pgw
  // action: "PG_DRAFT_REQUEST"
  // type: Post type (Announcement or Form)
  // data: Format refer to file announcementDraft.schema.ts or formDraft.schema.ts. Need in string type because too much data
  const submitDraft = (
    type: "PG_ANNOUNCEMENT" | "PG_CONSENT_FORM",
    data: any
  ) => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.PG_DRAFT_REQUEST,
      type,
      data:
        type === "PG_ANNOUNCEMENT"
          ? JSON.stringify(mockAnnouncement)
          : JSON.stringify(mockForm),
    });
  };

  // For PG only
  // Send request to extension, extension will change the active tab url to draft page
  // action: "GO_DRAFT_PAGE"
  // data: {
  //   id: announcementDraftId || consentFormDraftId,
  //   type: "announcements" || "consentForms",
  // }
  const goToDraftPage = () => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.GO_DRAFT_PAGE,
      draftInfo: draftInfo,
    });
  };

  const sendMessageToExtension = (data: any) => {
    console.log(`🟢 HeyTalia: ${data?.action}`);
    // window.parent.postMessage(data, `${chromeExtensionID}`);
    window.parent.postMessage(data, `*`); // // Temporary open to all listener
  };

  return (
    <Container>
      <Flex mt={10} align={"center"} justify={"center"} gap={10}>
        <Button onClick={() => submitDraft("PG_ANNOUNCEMENT", null)}>
          Submit Announcement Draft
        </Button>
        <Button onClick={() => submitDraft("PG_CONSENT_FORM", null)}>
          Submit Form Draft
        </Button>
        <Button onClick={goToDraftPage}>Go To Draft</Button>
      </Flex>

      <Flex mt={10} align={"center"} justify={"center"} gap={10}>
        <Button onClick={scanFormFields}>Scan</Button>
        <Button onClick={fillForm}>Fill</Button>
      </Flex>
    </Container>
  );
};
