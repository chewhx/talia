import {
  Button,
  Center,
  Container,
  Group,
  PasswordInput,
  Text,
} from "@mantine/core";
import { setPasswordCookie } from "./actions";

export default function Home() {
  return (
    <Container size="sm">
      <Center h="97vh">
        <form action={setPasswordCookie}>
          <Group align="end">
            <PasswordInput name="talia-password" w={300} label="Password" />
            <Button type="submit">Enter</Button>
          </Group>
        </form>
      </Center>

      <Center>
        <Text size="sm">v2.0.0</Text>
      </Center>
    </Container>
  );
}
