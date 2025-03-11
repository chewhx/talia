"use client";
import { Group, Button, TextInput } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import React from "react";
import { useFormStatus } from "react-dom";

function Login() {
  const { pending, data } = useFormStatus();

  const [saved, setSaved] = useLocalStorage({
    key: "heytalia-saved-user_email",
  });

  React.useEffect(() => {
    const _data = data?.get("user_email");
    if (_data) {
      setSaved(String(data?.get("user_email")));
    }
  }, [data, setSaved]);

  return (
    <Group align="end">
      <TextInput
        defaultValue={saved || ""}
        disabled={pending}
        name="user_email"
        w={300}
        placeholder="Your email"
      />
      <Button loading={pending} type="submit">
        Enter
      </Button>
    </Group>
  );
}

export default Login;
