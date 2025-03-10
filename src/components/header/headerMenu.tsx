"use Client";

import { clearCookies } from "@/app/actions";
import { useUser } from "@/context/userContext";
import { ActionIcon, Menu } from "@mantine/core";
import {
  IconDashboard,
  IconLogout2,
  IconMenu2,
  IconMessageChatbot,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function HeaderMenu() {
  const { displayName } = useUser();
  const router = useRouter();

  const signOut = async () => {
    await clearCookies();
    router.push("/");
  };

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
          onClick={() => router.push("/main")}
          leftSection={<IconMessageChatbot size={18} />}
        >
          Chatbot
        </Menu.Item>

        <Menu.Item
          onClick={() => router.push("/calendar-setting")}
          leftSection={<IconDashboard size={18} />}
        >
          Calendar Setting
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
