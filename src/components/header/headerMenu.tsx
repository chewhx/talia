"use Client";

import { useRouter } from "next/navigation";
import { useUser } from "./context/userContext";
import { ActionIcon, Menu } from "@mantine/core";
import {
  IconDashboard,
  IconLogout2,
  IconMenu2,
  IconMessageChatbot,
} from "@tabler/icons-react";

export function HeaderMenu({ signOut }: { signOut: () => Promise<void> }) {
  const { displayName } = useUser();
  const router = useRouter();

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle">
          <IconMenu2 />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label
          style={{
            fontSize: "14px",
            fontWeight: 500,
            padding: "8px 12px",
          }}
        >
          Hi, {displayName}
        </Menu.Label>

        <Menu.Item
          onClick={() => router.push("/chat")}
          leftSection={<IconMessageChatbot size={18} />}
        >
          Chatbot
        </Menu.Item>

        <Menu.Item
          // onClick={() => router.push("/dashboard")}
          leftSection={<IconDashboard size={18} />}
        >
          Dashboard
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          onClick={signOut}
          color="red"
          leftSection={<IconLogout2 size={18} />}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
