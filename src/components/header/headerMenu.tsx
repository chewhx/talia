"use Client";

import { clearCookies } from "@/app/actions";
import { useUser } from "@/context/userContext";
import { ActionIcon, Menu, Stack, Text } from "@mantine/core";
import {
  IconDashboard,
  IconLogout2,
  IconMenu2,
  IconMessageChatbot,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function HeaderMenu() {
  const { userDetails } = useUser();
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
        <Menu.Label>
          <Stack gap={0}>
            <Text fz="14px" fw={500}>
              Hi, {userDetails?.displayName ?? "There!"}
            </Text>
            <Text fz="xs">{userDetails?.school}</Text>
          </Stack>
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
