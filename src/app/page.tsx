import { Button, Center, Container, Group, Input, Text } from "@mantine/core";
import { setUserCookie } from "./actions";

export default function Home() {
  return (
    <Container size="sm">
      <Center h="97vh">
        <form action={setUserCookie}>
          <Group align="end">
            <Input name="user_email" w={300} placeholder="Your email" />
            <Button type="submit">Enter</Button>
          </Group>
        </form>
      </Center>

      <Center>
        <Text size="sm">v3.0.0</Text>
      </Center>
    </Container>
  );
}
